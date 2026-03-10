export { SYSTEM_TEMPLATES } from '~~/shared/system-templates'
export type { SystemTemplate } from '~~/shared/system-templates'

export const AVAILABLE_VARIABLES = [
  { key: '{{candidateName}}', desc: 'Full name' },
  { key: '{{candidateFirstName}}', desc: 'First name' },
  { key: '{{candidateLastName}}', desc: 'Last name' },
  { key: '{{candidateEmail}}', desc: 'Email address' },
  { key: '{{jobTitle}}', desc: 'Job title' },
  { key: '{{interviewTitle}}', desc: 'Interview title' },
  { key: '{{interviewDate}}', desc: 'Interview date' },
  { key: '{{interviewTime}}', desc: 'Interview time' },
  { key: '{{interviewDuration}}', desc: 'Duration (min)' },
  { key: '{{interviewType}}', desc: 'Interview type' },
  { key: '{{interviewLocation}}', desc: 'Location/link' },
  { key: '{{interviewers}}', desc: 'Interviewer names' },
  { key: '{{organizationName}}', desc: 'Your org name' },
] as const

export function renderTemplatePreview(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in variables ? variables[key]! : match
  })
}
