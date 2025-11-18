import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Query to get all todos
export const getTodos = query({
	handler: async (ctx) => {
		return await ctx.db.query("todos").collect()
	},
})

// Mutation to create a new todo
export const createTodo = mutation({
	args: { text: v.string() },
	handler: async (ctx, args) => {
		const todoId = await ctx.db.insert("todos", {
			text: args.text,
			isCompleted: false,
		})
		return todoId
	},
})

// Mutation to toggle todo completion status
export const toggleTodo = mutation({
	args: { id: v.id("todos") },
	handler: async (ctx, args) => {
		const todo = await ctx.db.get(args.id)
		if (!todo) {
			throw new Error("Todo not found")
		}
		await ctx.db.patch(args.id, {
			isCompleted: !todo.isCompleted,
		})
	},
})

// Mutation to delete a todo
export const deleteTodo = mutation({
	args: { id: v.id("todos") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id)
	},
})

// Mutation to update todo text
export const updateTodo = mutation({
	args: { id: v.id("todos"), text: v.string() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			text: args.text,
		})
	},
})
