import { and, eq } from 'drizzle-orm'
import { interview, application, candidate, job, emailTemplate, organization } from '../../../database/schema'
import { interviewIdParamSchema } from '../../../utils/schemas/interview'
import { sendInterviewInvitationSchema, SYSTEM_TEMPLATES } from '../../../utils/schemas/emailTemplate'
import { sendInterviewInvitationEmail, type InterviewEmailData } from '../../../utils/email'

const interviewTypeLabels: Record<string, string> = {
  video: 'Video Call',
  phone: 'Phone Call',
  in_person: 'In Person',
  technical: 'Technical Interview',
  panel: 'Panel Interview',
  take_home: 'Take-Home Assignment',
}

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { interview: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, interviewIdParamSchema.parse)
  const body = await readValidatedBody(event, sendInterviewInvitationSchema.parse)

  // Fetch interview with all related data
  const interviewRecord = await db.query.interview.findFirst({
    where: and(
      eq(interview.id, id),
      eq(interview.organizationId, orgId),
    ),
  })

  if (!interviewRecord) {
    throw createError({ statusCode: 404, statusMessage: 'Interview not found' })
  }

  if (interviewRecord.status === 'cancelled') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot send invitation for a cancelled interview' })
  }

  // Fetch application → candidate + job data
  const app = await db.query.application.findFirst({
    where: eq(application.id, interviewRecord.applicationId),
    with: {
      candidate: true,
      job: { columns: { title: true } },
    },
  })

  if (!app || !app.candidate) {
    throw createError({ statusCode: 404, statusMessage: 'Application or candidate not found' })
  }

  // Fetch organization name
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
    columns: { name: true },
  })

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  // Resolve template subject and body
  let emailSubject: string
  let emailBody: string

  if (body.templateId) {
    // Check system templates first
    const systemTemplate = SYSTEM_TEMPLATES.find(t => t.id === body.templateId)
    if (systemTemplate) {
      emailSubject = systemTemplate.subject
      emailBody = systemTemplate.body
    } else {
      // Look up custom template in database
      const customTemplate = await db.query.emailTemplate.findFirst({
        where: and(
          eq(emailTemplate.id, body.templateId),
          eq(emailTemplate.organizationId, orgId),
        ),
      })

      if (!customTemplate) {
        throw createError({ statusCode: 404, statusMessage: 'Email template not found' })
      }

      emailSubject = customTemplate.subject
      emailBody = customTemplate.body
    }
  } else if (body.customSubject && body.customBody) {
    emailSubject = body.customSubject
    emailBody = body.customBody
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Either a template or custom subject/body is required' })
  }

  // Build template data
  const scheduledAt = new Date(interviewRecord.scheduledAt)
  const emailData: InterviewEmailData = {
    candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
    candidateFirstName: app.candidate.firstName,
    candidateLastName: app.candidate.lastName,
    candidateEmail: app.candidate.email,
    jobTitle: app.job.title,
    interviewTitle: interviewRecord.title,
    interviewDate: scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    interviewTime: scheduledAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    interviewDuration: interviewRecord.duration,
    interviewType: interviewTypeLabels[interviewRecord.type] ?? interviewRecord.type,
    interviewLocation: interviewRecord.location,
    interviewers: interviewRecord.interviewers as string[] | null,
    organizationName: org.name,
  }

  // Send the email
  await sendInterviewInvitationEmail({
    subject: emailSubject,
    body: emailBody,
    data: emailData,
  })

  // Mark the interview as invitation sent
  const [updated] = await db.update(interview)
    .set({ invitationSentAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(interview.id, id),
      eq(interview.organizationId, orgId),
    ))
    .returning()

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'updated',
    resourceType: 'interview',
    resourceId: id,
    metadata: {
      action: 'invitation_sent',
      candidateEmail: app.candidate.email,
      templateId: body.templateId ?? 'custom',
    },
  })

  return {
    success: true,
    sentAt: updated?.invitationSentAt,
    candidateEmail: app.candidate.email,
  }
})
