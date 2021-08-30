const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let database = null;
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

const initializeDBServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Error :${error.message}`);
  }
};

initializeDBServer();
const converter = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};
const isStatus = (query) => {
  return query.status !== undefined;
};
const isPriority = (query) => {
  return query.priority !== undefined;
};
app.get("/todos/", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.query;
  let query = "";
  let data = "";
  switch (true) {
    case isStatus(request.query):
      query = `
        SELECT
            *
        FROM
            todo
        WHERE
            status='${status}';`;
      break;
    case isPriority(request.query):
      query = `
        SELECT
            *
        FROM
            todo
        WHERE
            priority='${priority}';`;
      break;
  }
  data = await database.all(query);
  response.send(data.map((obj) => converter(obj)));
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id=${todoId};`;
  const queryResponse = await database.get(requestQuery);
  response.send(converter(queryResponse));
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        todo
    WHERE
        id=${todoId}`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(id);
  const postQuery = `
    INSERT INTO
        todo(id, todo, priority, status, category, due_date)
    VALUES(${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
  await database.run(postQuery);
  response.send("Todo Successfully Added");
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateQuery = `
  SELECT 
    *
  FROM 
    todo
  WHERE 
    due_date='${date}';`;
  const dateResponse = await database.all(dateQuery);
  response.send(dateResponse.map((obj) => obj));
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let text = "";
  const previousValues = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id=${todoId};`;
  const queryResponse = await database.get(previousValues);
  const {
    status = queryResponse.status,
    priority = queryResponse.priority,
    todo = queryResponse.todo,
    category = queryResponse.category,
    dueDate = queryResponse.dueDate,
  } = request.body;
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      text = "Status Updated";
      break;
    case requestBody.priority !== undefined:
      text = "Priority Updated";
      break;
    case requestBody.todo !== undefined:
      text = "Todo Updated";
      break;
    case requestBody.category !== undefined:
      text = "Category Updated";
      break;
    case requestBody.dueDate !== undefined:
      text = "Due Date Updated";
      break;
  }
  const updateQuery = `
    UPDATE
        todo
    SET
        todo='${todo}',
        category='${category}',
        priority='${priority}',
        status='${status}',
        due_date='${dueDate}'
    WHERE
        id=${todoId};`;
  const responseValue = await database.run(updateQuery);
  response.send(`${text}`);
});
module.exports = app;
