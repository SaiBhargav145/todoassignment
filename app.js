const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB ERROR:${error.message}`);
    process.exit(1);
  }
};

const convertObjectToList = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndStatusProperty = (requestQuery) => {
  return category !== undefined && status !== undefined;
};
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return category !== undefined && status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", status, category, priority } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo 
            WHERE todo LIKE '%${search_q}%'
            AND status ='${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%'
          AND priority ='${priority}';`;
      break;
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND priority='${priority}'
        AND status='${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodoQuery = `
        SELECT *
        FROM todo 
        WHERE todo LIKE '%${search_q}%'
        AND category ='${category}'
        AND status='${status}';`;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodoQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND category='${category}'
        AND priority ='${priority}';`;
      break;
    default:
      getTodoQuery = `SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getTodoQuery);
  response.send(data.map((eachdata) => convertObjectToList(eachdata)));
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertObjectToList(todo));
});
app.get("/agenda/", async (request, response) => {
  const getDateQuery = `
    SELECT *
    FROM todo
    where due_date="2012-12-12";`;
  const date = await database.get(getDateQuery);
  response.send(convertObjectToList(date));
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, due_date } = request.body;
  const todoPostQuery = `
  INSERT INTO 
  todo (id, todo, priority, status,due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}','${due_date}');`;
  await database.run(todoPostQuery);
  response.send("Todo Successfully Added");
});
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.due_date !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${due_date}'
    WHERE
      id = ${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
