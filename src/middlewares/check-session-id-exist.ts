import { FastifyReply, FastifyRequest } from "fastify";

export async function checkSessionIdExist(request: FastifyRequest, reply: FastifyReply) {
  const sessionId = request.cookies.sessionId

  if(!sessionId) {
    return reply.status(400).send({
      error: 'Unauthorized'
    })
  }
}