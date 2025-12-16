const { Op } = require('sequelize');
const { Todo } = require('../models/Todo');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class TodoController {
  // Get all todos for current user
  static async getTodos(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where = { userId: req.user.id };
      
      if (status) {
        where.status = status;
      }
      
      if (priority) {
        where.priority = priority;
      }
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      // Execute query
      const { count, rows } = await Todo.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });
      
      res.json({
        success: true,
        data: {
          todos: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get single todo
  static async getTodo(req, res, next) {
    try {
      const { id } = req.params;
      
      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });
      
      if (!todo) {
        throw new ApiError(404, 'Todo not found');
      }
      
      res.json({
        success: true,
        data: { todo }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Create new todo
  static async createTodo(req, res, next) {
    try {
      const todoData = {
        ...req.body,
        userId: req.user.id
      };
      
      const todo = await Todo.create(todoData);
      
      logger.info(`Todo created: ${todo.id} by user ${req.user.id}`);
      
      res.status(201).json({
        success: true,
        data: { todo }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Update todo
  static async updateTodo(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Find todo
      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });
      
      if (!todo) {
        throw new ApiError(404, 'Todo not found');
      }
      
      // Handle status change to completed
      if (updateData.status === 'completed' && todo.status !== 'completed') {
        updateData.completedAt = new Date();
      } else if (updateData.status !== 'completed' && todo.status === 'completed') {
        updateData.completedAt = null;
      }
      
      // Update todo
      await todo.update(updateData);
      
      logger.info(`Todo updated: ${todo.id} by user ${req.user.id}`);
      
      res.json({
        success: true,
        data: { todo }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Delete todo
  static async deleteTodo(req, res, next) {
    try {
      const { id } = req.params;
      
      const todo = await Todo.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });
      
      if (!todo) {
        throw new ApiError(404, 'Todo not found');
      }
      
      await todo.destroy();
      
      logger.info(`Todo deleted: ${id} by user ${req.user.id}`);
      
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Bulk delete todos
  static async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, 'Array of todo IDs required');
      }
      
      const result = await Todo.destroy({
        where: {
          id: ids,
          userId: req.user.id
        }
      });
      
      logger.info(`Bulk delete: ${result} todos deleted by user ${req.user.id}`);
      
      res.json({
        success: true,
        message: `${result} todos deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get todos statistics
  static async getStatistics(req, res, next) {
    try {
      const todos = await Todo.findAll({
        where: { userId: req.user.id },
        attributes: ['status', 'priority']
      });
      
      const total = todos.length;
      const byStatus = todos.reduce((acc, todo) => {
        acc[todo.status] = (acc[todo.status] || 0) + 1;
        return acc;
      }, {});
      
      const byPriority = todos.reduce((acc, todo) => {
        acc[todo.priority] = (acc[todo.priority] || 0) + 1;
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          total,
          byStatus,
          byPriority,
          completedPercentage: total > 0 
            ? Math.round((byStatus.completed || 0) / total * 100) 
            : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TodoController;
