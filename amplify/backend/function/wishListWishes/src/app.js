/* Amplify Params - DO NOT EDIT
  AUTH_WISHLIST8E46888F_USERPOOLID
  ENV
  REGION
  STORAGE_WISHLISTAPP_ARN
  STORAGE_WISHLISTAPP_NAME
  STORAGE_WISHLISTAPP_STREAMARN
  STORAGE_WISHLISTBUCKET_BUCKETNAME
Amplify Params - DO NOT EDIT *//*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

const database = require('/opt/database')

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

const AWS = require('aws-sdk')

async function getAuthUser(req) {
  const authProvider = req.apiGateway.event.requestContext.identity.cognitoAuthenticationProvider
  console.log({ authProvider })
  if (!authProvider) {
    return
  }
  const parts = authProvider.split(':');
  const poolIdParts = parts[parts.length - 3];
  if (!poolIdParts) {
    return
  }
  const userPoolIdParts = poolIdParts.split('/');

  const userPoolId = userPoolIdParts[userPoolIdParts.length - 1];
  const userPoolUserId = parts[parts.length - 1];

  const cognito = new AWS.CognitoIdentityServiceProvider();
  const listUsersResponse = await cognito.listUsers({
    UserPoolId: userPoolId,
    Filter: `sub = "${userPoolUserId}"`,
    Limit: 1,
  }).promise();

  const user = listUsersResponse.Users[0];
  return user
}


/**********************
 * Example get method *
 **********************/
app.get('/posts', async (req, res) => {
  console.log("from get posts in app.js in backend")
  try {
    const authUser = await getAuthUser(req)
    let posts = await database.getPosts(authUser.Username)
    posts.Items = posts.Items.map(post => {
      return {
        ...post,
        id: post.SK.replace("POST#", "")
      }
    })
    res.send(posts)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});



app.get('/posts/users', async (req, res) => {
  console.log("from get users in app.js in backend")
  try {
    const authUser = await getAuthUser(req)
    let result = await database.getUser(authUser.Username)
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id
  try {
    let comments = await database.getComments(postId)
    comments.Items = comments.Items.map(comment => {
      return {
        ...comment,
        id: comment.SK.replace("COMMENT#", "")
      }
    })
    res.send(comments)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


///////just added this and it might break the code///////////////
app.get('/posts/:id/:commentid', async (req, res) => {
  const postId = req.params.id
  const commentId = req.params.commentid
  try {
    const authUser = await getAuthUser(req)
    let comments = await database.getComment(postId, commentId, authUser.Username)
    comments.Items = comments.Items.map(comment => {
      return {
        ...comment,
        id: comment.SK.replace("COMMENT#", "")
      }
      // return comment
    })
    res.send(comments)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});
////////////////////////////////////////////////////////////////////
/****************************
* Example post method *
****************************/

app.post('/posts', async (req, res) => {
  const description = req.body.description
  const imageName = req.body.imageName
  try {
    const authUser = await getAuthUser(req)
    const result = await database.createPost(authUser.Username, description, imageName)
    result.id = result.SK.replace("POST#", "")
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.post('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id
  const text = req.body.text
  try {
    const authUser = await getAuthUser(req)
    const result = await database.createComment(authUser.Username, postId, text)
    result.id = result.SK.replace("COMMENT#", "")
    res.send(result)
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
})

/****************************
* Example put method *
****************************/

app.put('/posts/:id/:commentid', async (req, res) => {
  const postId = req.params.id
  const commentId = req.params.commentid
  const comment = req.body.comment
  try {
    let updatedComment = await database.updateComment(postId, commentId, comment)
    return updatedComment
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});


app.put('/posts/:id', async (req, res) => {
  const postId = req.params.id
  const description = req.body.description
  try {
    const authUser = await getAuthUser(req)
    let updatedPost = await database.updatePost(authUser.Username, postId, description)
    return updatedPost
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
});

/****************************
* Example delete method *
****************************/

app.delete('/posts', function (req, res) {
  // Add your code here
  console.log('inside delete posts api req')
  res.json({ success: 'delete all posts call', url: req.url });
});

// app.delete('/posts/:id', function (req, res) {
//   const postId = req.params.id

//   //check username passed from body of delete request from amplify
//   //try to place into res.json object and print
//   const userName = req.body.userName

//   //why as I receiving a cors error for authUser?? 
//   // const authUser = await getAuthUser(req)
//   // res.json({ success: 'delete a specific post call', authUserName: authUser.Username, url: req.url });

//   res.json({ success: 'delete all posts call', username: userName, url: req.url });
// });

// app.delete('/posts/:id', function (req, res) {
//   const postId = req.params.id
//   try {
//     const authUser = await getAuthUser(req)
//     console.log("from app.js delete method" + authUser.Username)
//     console.log(postId)
//     const result = await database.delete(authUser.Username, postId)
//     res.send(result)
//   } catch (error) {
//     console.error(error)
//     res.status(500).send(error)
//     // res.json({ error: 'delete call error!', url: req.url });
//   }
// });

app.delete('/posts/:id', async function (req, res) {
  const postId = req.params.id;
  console.log("post id: " + postId)
  try {
    const authUser = await getAuthUser(req)
    const post = await database.getPost(authUser.Username, postId)
    console.log(post)
    if (Object.keys(post).length === 0) {
      res.status(403).send({ error: "Cannot delete" })
    } else {
      const result = await database.deletePost(authUser.Username, postId)
      console.log("Result: " + JSON.stringify(result))
      res.send({ message: "deleted successfully", postId: postId })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
});


app.delete('/posts/:id/:commentid', async function (req, res) {
  const postId = req.params.id;
  const commentId = req.params.commentid
  console.log("post id: " + postId)
  try {
    const authUser = await getAuthUser(req)
    const result = await database.deleteComment(postId, commentId, authUser.Username)
    console.log("Result: " + JSON.stringify(result))
    res.send({ message: "comment deleted successfully", result: result })
    // }
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
});


app.listen(3000, function () {
  console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
