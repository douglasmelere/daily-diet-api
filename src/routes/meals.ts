import { FastifyInstance } from "fastify";
import { checkSessionIdExist } from "../middlewares/check-session-id-exist";
import { knex } from "../database";
import { z } from "zod";
import { randomUUID } from "crypto";

async function getUserBySessionId(sessionId: string) {
  const [user] = await knex('users').where('session_id', sessionId).select('id');
  return user;
}

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/',
    {
      preHandler: [checkSessionIdExist]
    },
    async (request, reply) => {
      try {
        const { sessionId } = request.cookies;

        // Verificando se o usuário existe com o sessionId
        const user = await getUserBySessionId(sessionId!);
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const userId = user.id;

        // Definir o esquema de validação para o corpo da requisição
        const createMealBodySchema = z.object({
          name: z.string(),
          description: z.string(),
          isOnTheDiet: z.boolean()
        });

        // Validando os dados da requisição
        const { name, description, isOnTheDiet } = createMealBodySchema.parse(request.body);

        // Inserindo a refeição no banco de dados
        await knex('meals').insert({
          id: randomUUID(),
          user_id: userId,
          name,
          description,
          isOnTheDiet,
        });

        return reply.status(201).send();

      } catch (error) {
        console.error(error); // Logando o erro no servidor

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );

  app.get('/',
    {
      preHandler: [checkSessionIdExist]
    },
    async (request, reply) => {
      try {
        const { sessionId } = request.cookies;

        const user = await getUserBySessionId(sessionId!);
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const userId = user.id;
        const userMeals = await knex('meals').where('user_id', userId).select('*');

        return reply.status(200).send({ userMeals });

      } catch (error) {
        console.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );

  app.get('/:id',
    {
      preHandler: [checkSessionIdExist]
    },
    async (request, reply) => {
      try {
        const getMealParamsSchema = z.object({
          id: z.string().uuid()
        });

        const params = getMealParamsSchema.parse(request.params);
        const { sessionId } = request.cookies;

        const user = await getUserBySessionId(sessionId!);
        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const userId = user.id;
        const meal = await knex('meals').where('id', params.id).andWhere('user_id', userId).first();

        if (!meal) {
          return reply.status(404).send({ error: 'Meal not found' });
        }

        return reply.status(200).send({ meal });

      } catch (error) {
        console.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );

  app.delete('/:id', 
    {
      preHandler: [checkSessionIdExist]
    }
    ,async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid()
    })

    const params = getMealParamsSchema.parse(request.params)
    const { sessionId } = request.cookies

    const user = await getUserBySessionId(sessionId!)
    const userId = user.id

    const meal = await knex('meals').where('id', params.id).andWhere('user_id', userId).first().delete()
    
    if(!meal) {
      return reply.status(404).send({
        error: 'Meal not found!'
      })
    }
    return reply.status(202).send('Meal has been deleted')
  })

  app.put('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid()
    })

    const params = getMealParamsSchema.parse(request.params)

    const { sessionId } = request.cookies
    const user = await getUserBySessionId(sessionId!)

    const userId = user.id

    const editMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isOnTheDiet: z.boolean()
    })

    const { name, description, isOnTheDiet } = editMealBodySchema.parse(request.body)

    const meal = await knex('meals').where('id', params.id).andWhere('user_id', userId).first().update({
      name,
      description,
      isOnTheDiet
    })

    if(!meal) {
      return reply.status(404).send({
        error: 'Meal not found!'
      })
    }

    return reply.status(202).send()
  })

  app.get('/summary', 
    {
      preHandler: [checkSessionIdExist]
    }
    ,async (request, reply) => {
      
      const { sessionId } = request.cookies
      const user = await getUserBySessionId(sessionId!)

      const userId = user.id

      const [mealsCount] = await knex('meals').count('id', {
        as: 'Number of Meals'
      }).where('user_id', userId)

      const mealsOnTheDiet = await knex('meals').count('id', {
        as: 'Meals On The Diet'
      }).where('user_id', userId).andWhere('isOnTheDiet', true)

      const mealsNotOnTheDiet = await knex('meals').count('id', {
        as: 'Non-Diet Meals'
      }).where('user_id', userId).andWhere('isOnTheDiet', false)

      const summary = {
        'Registered Meals': parseInt(
          JSON.parse(JSON.stringify(mealsCount))['Registered Meals'] || '0', 10
        ),
        'Meals On The Diet': parseInt(
          JSON.parse(JSON.stringify(mealsOnTheDiet))[0]['Meals On The Diet']
        ),
        'Non-Diet Meals': parseInt(
          JSON.parse(JSON.stringify(mealsNotOnTheDiet))[0]['Non-Diet Meals']
        )
      }

      return reply.status(200).send({
        summary
      })
  })
}

