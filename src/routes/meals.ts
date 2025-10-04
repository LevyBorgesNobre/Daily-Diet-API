import { FastifyInstance } from "fastify";
import { z } from "zod"
import { knexSetup } from "database";
import { randomUUID } from "node:crypto";
import { get } from "node:http";

export async function mealsRoutes(app : FastifyInstance){

   app.get('/', async()=>{
      const meals = await knexSetup('meals').select('*')

      return{
         meals
      }
   })
   
  app.get('/delete/:id', async(req, reply)=>{
   try {
      const deleteMealParamsSchema = z.object({
         id:z.string().uuid()
     })

     const { id } = deleteMealParamsSchema.parse(req.params)

    const deleteMeal = await knexSetup('meals').where('id', id).delete()

    if(deleteMeal){
      reply.status(200).send({message: 'Meal deleted successfully'})
    } else {
      reply.status(404).send({message: 'Meal not found'})
    }
   } catch (error) {
      reply.status(500).send({message: 'Internal server error'})
   }
     
  })

   app.get('/:id', async(req, reply)=>{
      
      try {
          const getMealParamsSchema = z.object({
         id: z.string().uuid()
      })
      
      const { id } = getMealParamsSchema.parse(req.params)

      const meal = await knexSetup('meals').where('id', id).first()
      
      if(meal){
         reply.status(200).send({message: 'meal found successfull'})
      } else {
         reply.status(404).send({message: 'meal not found'})
      }
      } catch (error) {
         reply.status(500).send({message: 'Internal server error'})
      }
     
   })

    app.post('/', async(req, reply)=>{
     const createMealsBodySchema = z.object({
        name:z.string().max(30, {message: 'Name must be at most 30 characters long'}),
        description: z.string().max(300, {message: 'Description must be at most 300 characters long'}),
        type:z.enum(['inDiet', 'outDiet'],{message:'the options must be inDiet or outDiet'})
     })

       const {name, description, type} = createMealsBodySchema.parse(req.body)
       
       await knexSetup('meals').insert({
        id:randomUUID(),
        name,
        description,
        type
       })

       return reply.status(201).send({message: 'Meal created successfully'})
    })
}