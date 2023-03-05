import { Answer } from '../messaging'

export type Event =
  | {
      type: 'answer'
      data: Answer
    }
  | {
      type: 'done'
    }

export interface GenerateAnswerParams {
  prompt: string
  onEvent: (event: Event) => void
  signal?: AbortSignal
}

export interface ChatMessageType {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Provider {
  generateAnswer(params: GenerateAnswerParams): Promise<{ cleanup?: () => void }>
}

export interface GptMessageResp {
  role: string
  content: string
  finish_reason: string
  index: number
}
