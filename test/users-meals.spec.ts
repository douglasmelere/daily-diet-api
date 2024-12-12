import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { knex } from '../src/database'
import { execSync } from 'child_process'

describe('User and Meal Routes', async () => {
  const userData = {
    name: 'Douglas Melere',
    email: 'douglasmelere@gmail.com',
    address: 'Bairro Dona Helena - N° 443',
    weight: 90,
    height: 1.80
  }

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new account', async () => {

    await request(app.server)
      .post('/users')
      .send(
        userData        
      ).expect(201)  
  })  

  it('should be able to create a new meal', async () => {
    const createUserResponse = await request(app.server)
    .post('/users')
    .send(
      userData
    )  
    const cookies = createUserResponse.get('Set-Cookie');
    const userId = await knex('users').select('id').where('email', userData.email)

    await request(app.server)
      .post('/meals')
      .send({
        user_id: userId,
        name: 'Meal Test',
        description: 'Test',
        isOnTheDiet: false
      })
      .set('Cookie', cookies!)
      .expect(201)
  })

  it('should be able to list all transactions', async () => {

    const createUserResponse = await request(app.server)
    .post('/users')
    .send(
      userData
    )  

    const cookies = createUserResponse.get('Set-Cookie');
    const userId = knex('users').select('id').where('email', userData.email)

    await request(app.server)
    .post('/meals')
    .send({
      user_id: userId,
      name: 'Meal Test List',
      description: 'Test',
      isOnTheDiet: false
    })
    .set('Cookie', cookies!)

    await request(app.server)
    .post('/meals')
    .send({
      user_id: userId,
      name: 'Meal Test List 2',
      description: 'Test',
      isOnTheDiet: false
    })
    .set('Cookie', cookies!)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)
      .expect(200)

      expect(listMealsResponse.body.userMeals).toEqual([
        expect.objectContaining({
          name: 'Meal Test List',
          description: 'Test'
        }),
        expect.objectContaining({
          name: 'Meal Test List 2',
          description: 'Test'
        })
      ])
  })

  it('shoud be able to get a summary meals', async () => {
    const createUserResponse = await request(app.server).post('/users')
    .send(
      userData
    )

    const cookies = createUserResponse.get('Set-Cookie');
    const userId = await knex('users').select('id').where('email', userData.email)

    await request(app.server).post('/meals')
        .send({
          user_id: userId,
          name: 'Summary Meal Test',
          description: 'Test',
          isOnTheDiet: true
        }).set('Cookie', cookies!)

        await request(app.server).post('/meals')
        .send({
          user_id: userId,
          name: 'Summary Meal Test 2',
          description: 'Test',
          isOnTheDiet: true
        }).set('Cookie', cookies!)

        await request(app.server).post('/meals')
        .send({
          user_id: userId,
          name: 'Summary Meal Test 3',
          description: 'Test',
          isOnTheDiet: false
        }).set('Cookie', cookies!)

        const summaryResponse = await request(app.server).get('/meals/summary').set('Cookie', cookies!).expect(200)

        expect(summaryResponse.body.summary).toEqual({
          'Registered Meals': 3,
          'Meals On The Diet': 2,
          'Non-Diet Meals': 1
        })
  })

  it('should be able to delete a specific meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send(
      userData
    ).expect(201)

    const cookies = createUserResponse.get('Set-Cookie');
    const userId = await knex('users').select('id').where('email', userData.email)

    await request(app.server).post('/meals').send({
      user_id: userId,
      name: 'Delete Meal Test',
      description: 'Test',
      isOnTheDiet: true
    }).set('Cookie', cookies!)

    const listMealResponse = await request(app.server).get('/meals').set('Cookie', cookies!).expect(200)
    const mealId = listMealResponse.body.userMeals[0].id

    await request(app.server).delete(`/meals/${mealId}`).set('Cookie', cookies!).expect(202)
  })

  it('should be able to edit specific meal', async () => {
    const createUserResponse = await request(app.server).post('/users').send(
      userData
    ).expect(201)

    const cookies = createUserResponse.get('Set-Cookie');
    const userId = await knex('users').select('id').where('email', userData.email)

    await request(app.server).post('/meals').send({
      user_id: userId,
      name: 'Edit Meal Test',
      description: 'Test',
      isOnTheDiet: true
    }).set('Cookie', cookies!).expect(201)

    const listMealResponse = await request(app.server).get('/meals').set('Cookie', cookies!).expect(200)
    const mealId = listMealResponse.body.userMeals[0].id

    await request(app.server).put(`/meals/${mealId}`).set('Cookie', cookies!).send({
      name: 'Edited Meal',
      description: 'Test',
      isOnTheDiet: true
    }).expect(202)
  })
})