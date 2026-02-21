export default defineEventHandler(async (event) => {
  try {
    return await auth.handler(toWebRequest(event))
  } catch (error) {
    const requestUrl = getRequestURL(event)
    console.error('[Applirank] Auth handler error', {
      method: event.method,
      path: requestUrl.pathname,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    const exposeDetails = isRailwayPreviewEnvironment(env.RAILWAY_ENVIRONMENT_NAME) || import.meta.dev
    const details = error instanceof Error ? error.message : 'Unknown error'

    throw createError({
      statusCode: 500,
      statusMessage: exposeDetails ? `Auth handler failed: ${details}` : 'Server Error',
      data: exposeDetails
        ? {
            code: 'AUTH_HANDLER_ERROR',
            message: details,
          }
        : undefined,
    })
  }
})
