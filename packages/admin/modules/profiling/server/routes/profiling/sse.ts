export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const { onTaskStateChange } = useProfilingTask()

  onTaskStateChange((state) => {
    eventStream.push(JSON.stringify(state)).catch((error) => {
      console.error('Error sending SSE:', error)
    })
  })


  eventStream.onClosed(async () => {
    await eventStream.close()
  })

  return eventStream.send()
})