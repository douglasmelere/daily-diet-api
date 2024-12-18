import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      address: string
      weight: number
      height: number
      session_id: string
    },
    meals: {
      id: string
      user_id: string
      name: string
      description: string
      isOnTheDiet: boolean
      created_at: Date
    }
  }
}