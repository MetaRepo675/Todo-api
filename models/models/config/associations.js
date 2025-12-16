const User = require('../models/User');
const Todo = require('../models/Todo');

// User has many Todos
User.hasMany(Todo, {
  foreignKey: 'userId',
  as: 'todos',
  onDelete: 'CASCADE'
});

// Todo belongs to User
Todo.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = { User, Todo };
