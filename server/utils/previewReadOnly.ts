const PREVIEW_READ_ONLY_MESSAGE = 'Preview mode — this action is disabled. Deploy your own instance to get full access.'

export function createPreviewReadOnlyError() {
  return createError({
    statusCode: 403,
    statusMessage: PREVIEW_READ_ONLY_MESSAGE,
    data: {
      code: 'PREVIEW_READ_ONLY',
      message: PREVIEW_READ_ONLY_MESSAGE,
    },
  })
}
