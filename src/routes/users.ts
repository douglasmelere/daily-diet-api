import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";
import { z } from 'zod'
import { knex } from "../database";

export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      address: z.string(),
      weight: z.number(),
      height: z.number()
    })

    const { name, email, address, weight, height } = createUserBodySchema.parse(request.body)

    const checkUserExist = await knex.select('*').from('users').where('email', email).first()

    if(checkUserExist) {
      return reply.status(400).send({
        error: 'This email has been associated with another user!'
      })
    }

    let sessionId = request.cookies.sessionId

    if(!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      address,
      weight,
      height,
      session_id: sessionId
    })
  })

  app.get('/', async (_request, reply) => {
    const users = await knex.select('*').from('users')

    reply.status(200).send({ users })
  })
}