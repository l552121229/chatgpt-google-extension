import { fetchSSE } from '../fetch-sse'
import { ChatMessageType, GenerateAnswerParams, Provider } from '../types'

export class GptTurboProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildMessage(msg: string): [ChatMessageType] {
    return [
      {
        role: 'user',
        content: msg,
      },
    ]
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    await fetchSSE('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.buildMessage(params.prompt),
        stream: true,
        // max_tokens: 2048,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        if (message === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        let role
        try {
          data = JSON.parse(message)
          const choices = data.choices[0]
          if ('finish_reason' in choices) {
            if (choices.finish_reason === 'stop') {
              return
            }
            if (choices.finish_reason) {
              console.log('finish', choices.finish_reason)
              return
            }
          }

          const delta = choices.delta
          if ('role' in delta && delta.role) {
            role = delta.role
          }
          if ('content' in delta && delta.content) {
            result += delta.content
          }

          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
