import { FastifyInstance } from "fastify";
import { z } from "zod"
import { knexSetup } from "database";
import { randomUUID } from "node:crypto";
import { get } from "node:http";
import { checkSessionIdExists } from "middleware/check-session-id-exists";

export async function mealsRoutes(app : FastifyInstance){

   app.get('/', {
      preHandler: [checkSessionIdExists]
   }, async(req)=>{
      
      const sessionId = req.cookies.sessionId

      const meals = await knexSetup('meals')
      .where('session_id', sessionId)
      .select()
 
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
      
    const sessionId = req.cookies.sessionId

    const deleteMeal = await knexSetup('meals').where(id, sessionId).delete()

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
     
      const sessionId = req.cookies.sessionId

      const meal = await knexSetup('meals').where({
         session_id: sessionId,
         id, 
      }).first()
      
      if(meal){
         return meal
      } else {
         reply.status(404).send({message: 'meal not found'})
      }
      } catch (error) {
         reply.status(500).send({message: 'Internal server error'})
      }
     
   })

   app.get('/in-diet/count',{
      preHandler: [checkSessionIdExists]
   },  async(req)=>{
       const sessionId = req.cookies.sessionId

       const result =  await knexSetup('meals')
        .where('session_id', sessionId)
        .select(knexSetup.raw(`SUM(CASE WHEN type = 'inDiet' THEN 1 ELSE 0 END) AS inDiet  `));

         return result
   })

   app.get('/out-diet/count', async(req)=>{
     const sessionId = req.cookies.sessionId

    const result =  await knexSetup('meals')
     .where('session_id', sessionId)
     .select(knexSetup.raw(` SUM(CASE WHEN type = 'outDiet' THEN 1 ELSE 0 END) AS outDiet `));

         return result 
   } )


   app.get('/total-diet/count', async(req)=>{
      const sessionId = req.cookies.sessionId

     const result = await knexSetup('meals')
      .where('session_id', sessionId)
      .select(knexSetup.raw(`SUM(CASE WHEN type IN ('outDiet', 'inDiet') THEN 1 ELSE 0 END) AS totalDiet`))

      return result
   })

    app.post('/', async(req, reply)=>{
     const createMealsBodySchema = z.object({
        name:z.string().max(30, {message: 'Name must be at most 30 characters long'}),
        description: z.string().max(300, {message: 'Description must be at most 300 characters long'}),
        type:z.enum(['inDiet', 'outDiet'],{message:'the options must be inDiet or outDiet'})
     })

       const {name, description, type} = createMealsBodySchema.parse(req.body)
       
        let sessionId = req.cookies.sessionId
   
       if(!sessionId){
       sessionId = crypto.randomUUID()
       reply.cookie('sessionId', sessionId, {
       path:'/',
       maxAge: 60 * 60 * 24 * 7 //7 days
      })
      }
      
       await knexSetup('meals').insert({
        id:randomUUID(),
        name,
        description,
        type,
        session_id : sessionId
       })

       return reply.status(201).send({message: 'Meal created successfully'})
    })
}