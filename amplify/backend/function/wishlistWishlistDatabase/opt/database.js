const AWS = require('aws-sdk')

const { ulid } = require('ulid')
AWS.config.update({ region: 'us-west-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "wishlistApp";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const partitionKeyName = "PK"
const sortKeyName = "SK"
const invertIndex = "invertedIndex"

async function createUser(username) {
  const Item = {
    username: username,
    PK: "USER#" + username,
    SK: "USER#" + username,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    created: new Date().toISOString()
  }
  let params = {
    TableName: tableName,
    Item
  }
  await dynamodb.put(params).promise()
  return Item
}
exports.createUser = createUser


async function createPost(username, description, imageName) {
  console.log("IN CREATE POST IN DB")
  const Item = {
    PK: "USER#" + username,
    SK: "POST#" + ulid(),
    username,
    description,
    imageName,
    created: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  }

  let createParams = {
    TableName: tableName,
    Item: Item
  }

  let updateParams = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "USER#" + username,
    },
    UpdateExpression: "SET postCount = postCount+ :inc",
    ExpressionAttributeValues: {
      ":inc": 1
    }
  }

  await dynamodb.put(createParams).promise()
  await dynamodb.update(updateParams).promise()

  return Item
}
exports.createPost = createPost


async function createComment(username, postId, commentText) {
  const Item = {
    PK: "POST#" + postId,
    SK: "COMMENT#" + ulid(),
    username,
    commentText,
    created: new Date().toISOString(),
  }
  let params = {
    TableName: tableName,
    Item
  }

  let updateParams = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "POST#" + postId,
    },
    // UpdateExpression: "SET commentCount = commentCount+ :inc",
    // ExpressionAttributeValues: {
    //   ":inc": 1
    // }
  }

  await dynamodb.put(params).promise()
  await dynamodb.update(updateParams).promise()

  return Item
}
exports.createComment = createComment



async function getPost(username, postId) {
  let params = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "POST#" + postId
    }
  }

  const result = await dynamodb.get(params).promise()
  return result
}
exports.getPost = getPost

async function getPosts(username) {
  let params = {
    TableName: tableName,
    KeyConditions: {
      PK: {
        ComparisonOperator: 'EQ',
        AttributeValueList: ["USER#" + username]
      },
      SK: {
        ComparisonOperator: 'BEGINS_WITH', // [IN, NULL, BETWEEN, LT, NOT_CONTAINS, EQ, GT, NOT_NULL, NE, LE, BEGINS_WITH, GE, CONTAINS]
        AttributeValueList: ["POST#"]
      }
    },
    ScanIndexForward: false
  }

  const result = await dynamodb.query(params).promise()
  return result
}
exports.getPosts = getPosts



async function getComments(postId) {
  let params = {
    TableName: tableName,
    KeyConditions: {
      PK: {
        ComparisonOperator: 'EQ',
        // AttributeValueList: ["POST#" + postId]
        // AttributeValueList: ["POST#" + postId]
        AttributeValueList: ["POST#" + postId]
      },
      SK: {
        ComparisonOperator: 'BEGINS_WITH', // [IN, NULL, BETWEEN, LT, NOT_CONTAINS, EQ, GT, NOT_NULL, NE, LE, BEGINS_WITH, GE, CONTAINS]
        AttributeValueList: ["COMMENT#"]
      }
    },
    ScanIndexForward: false
  }

  const result = await dynamodb.query(params).promise()
  return result
}
exports.getComments = getComments



async function getUser(username) {
  let params = {
    TableName: table,
    KeyConditions: {
      PK: {
        ComparisonOperator: 'EQ',
        AttributeValueList: ["USER#" + username]
      },
      SK: {
        ComparisonOperator: 'EQ',
        AttributeValueList: ["USER#" + username]
      }
    }
  }
  const result = await docClient.query(params).promise()
  console.log(result)
}
exports.getUser = getUser


// async function deletePost(username, postId) {
//   let params = {
//     TableName: tableName,
//     Key: {
//       PK: "USER#" + username,
//       SK: "POST#" + postId
//     }
//   }
//   const result = await dynamodb.delete(params).promise()
//   console.log(result)
//   return result
// }
// exports.deletePost = deletePost


async function deletePost(username, postId) {
  let params = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "POST#" + postId
    }
  }
  let updateParams = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "USER#" + username,
    },
    // UpdateExpression: "SET postCount = postCount - :inc",
    // ExpressionAttributeValues: {
    //     ":inc": 1
    // }
  }
  const result = await dynamodb.delete(params).promise()
  await dynamodb.update(updateParams).promise()
  return result
}
exports.deletePost = deletePost



///////////////////need to make sure this works
async function deleteComment(postId, commentId, username) {
  let params = {
    TableName: tableName,
    Key: {
      PK: "POST#" + postId,
      SK: "COMMENT#" + commentId
    }
  }
  let updateParams = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "POST#" + postId,
    },
    // UpdateExpression: "SET postCount = postCount - :inc",
    // ExpressionAttributeValues: {
    //     ":inc": 1
    // }
  }
  const result = await dynamodb.delete(params).promise()
  await dynamodb.update(updateParams).promise()
  return result
}
exports.deleteComment = deleteComment


// async function getComment(postId, commentId, newText) {
//   console.log(postId)
//   let params = {
//     TableName: tableName,
//     KeyConditions: {
//       PK: {
//         ComparisonOperator: 'EQ',
//         AttributeValueList: ["POST#" + postId]
//         // AttributeValueList: [postId]
//       },
//       SK: {
//         ComparisonOperator: 'EQ', // [IN, NULL, BETWEEN, LT, NOT_CONTAINS, EQ, GT, NOT_NULL, NE, LE, BEGINS_WITH, GE, CONTAINS]
//         AttributeValueList: ["COMMENT#" + commentId]
//       }
//     },

//     // UpdateExpression: "SET text = :newText",
//     // ExpressionAttributeValues: {
//     //   ":newText": newText
//     // },
//     // ScanIndexForward: false
//   }

//   const result = await dynamodb.query(params).promise()
//   console.log(result)
//   return result
// }
// exports.getComment = getComment


async function updateComment(postId, commentId, newText) {
  let params = {
    TableName: tableName,
    Key: {
      PK: "POST#" + postId,
      SK: "COMMENT#" + commentId
    },

    UpdateExpression: "SET commentText = :newText",
    ExpressionAttributeValues: {
      ":newText": newText
    },
    ReturnValues: "UPDATED_NEW"
  }
  const result = await dynamodb.update(params).promise()
  console.log(result)
  return result
}
exports.updateComment = updateComment


async function updatePost(username, postId, newDescription) {
  let params = {
    TableName: tableName,
    Key: {
      PK: "USER#" + username,
      SK: "POST#" + postId
    },

    UpdateExpression: "SET description = :newDescription",
    ExpressionAttributeValues: {
      ":newDescription": newDescription
    },
    ReturnValues: "UPDATED_NEW"
  }
  const result = await dynamodb.update(params).promise()
  console.log(result)
  return result
}
exports.updatePost = updatePost


