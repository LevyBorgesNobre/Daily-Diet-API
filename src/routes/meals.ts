import { FastifyInstance } from "fastify";
import { z } from "zod"
import { knexSetup } from "database";
import { randomUUID } from "node:crypto";

export async function mealsRoutes(app : FastifyInstance){
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