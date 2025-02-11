/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */


'use strict';


// ------------- BEGIN MODEL ---------------
var mongoose = require('mongoose');
//var mongodbUri = 'mongodb://heroku_2w56zwxb:iv2ghrpt8nfs7m8vdnu2tpte0t@ds145245.mlab.com:45245/heroku_2w56zwxb';
var mongodbUri = process.env.MONGODB_URI;

mongoose.connect(mongodbUri);


var messageSchema = mongoose.Schema({
  reference: { type: String, required: true },
  body : { type: String, required: true }, // json message template
  order: { type: Number },
  mismatch : {type: Boolean},
  tempo : {type: Number}
},
{
    timestamps: true
});

// Store song documents in a collection called "songs"
var Message = mongoose.model('messages', messageSchema);

var idlesSchema = mongoose.Schema({
  reference: { type: String, required: true },
  idle10 : { type: String },
  idle24 : { type: String }, // json message template
  idle72 : { type: String }
},
{
    timestamps: true
});

var Idles = mongoose.model('idles', idlesSchema);


var userSchema = mongoose.Schema({
  user_id: { type: String, required: true }, // messenger user id,
  first_name: { type: String, required: true },
  last_name : { type: String },
  profile_pic : { type: String },
  locale: { type: String },
  timezone: { type: String },
  gender: { type: String },
  progress : {type: Number}

},
{
    timestamps: true
});

var User = mongoose.model('user', userSchema);


var userSessionSchema = mongoose.Schema({
  sender_id : { type: String, required: true },
  receiver_id : { type: String, required: true }, // nivel do menu que usuario está
  body : { type: String },
  last_payload : { type: String }, // ultima opção que usuario enviou
  idle10 : {type: Boolean, default: false},
  idle24 : {type: Boolean, default: false},
  idle72 : {type: Boolean, default: false}

},
{
    timestamps: true
});

var UserSession = mongoose.model('user_sessions', userSessionSchema);

// ------------- END MODEL ---------------

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;
      var currentUser = undefined;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {


      if (messagingEvent.optin ||
          messagingEvent.delivery ||
          messagingEvent.read ||
          messagingEvent.account_linking){
            //console.log("DESNECESSÁRIO");
      }else{

        if(messagingEvent.postback){
          var payload = messagingEvent.postback.payload;
        }else{
          var payload = null;
        }

        request({
          uri: 'https://graph.facebook.com/v2.6/' + messagingEvent.sender.id,
          method: 'GET',
          qs: { access_token: PAGE_ACCESS_TOKEN , fields : 'first_name,last_name,profile_pic,locale,timezone,gender'}

        }, function(error, response, body){
            //console.log("DEBUG: respota do facebook "+ response.statusCode);

            if (!error && response.statusCode == 200) {

              var where = {"user_id": messagingEvent.sender.id};
              var fbUser = JSON.parse(body);
              currentUser = new User({
                user_id: messagingEvent.sender.id,
                first_name: fbUser.first_name,
                last_name : fbUser.last_name,
                profile_pic : fbUser.profile_pic,
                locale: fbUser.locale,
                timezone: fbUser.timezone,
                gender: fbUser.gender
              });

              if(payload != "PROGRESS" && payload != "HELP" && payload != "DECO" && payload != null){
                currentUser.progress = getProgress(payload);
              }

              User.findOne(where, function(err, user){
                if(!user){

                  currentUser.save(function(err, doc){
                    handleHaveUser(err, doc, currentUser);
                  });

                }else{

                  user.first_name = currentUser.first_name;
                  user.last_name = currentUser.last_name;
                  user.profile_pic = currentUser.profile_pic;
                  user.locale = currentUser.locale;
                  user.timezone = currentUser.timezone;
                  user.gender = currentUser.gender;

                  if(payload != "PROGRESS" && payload != "HELP" && payload != "DECO" && payload != null){
                    user.progress = getProgress(payload);
                  }

                  user.save(function(err, doc){
                    handleHaveUser(err, doc, user);
                  });

                }

              });

            }else{
              //TODO: throw ERROR AND CATCH IT
            }
        });


        function handleHaveUser(err, numAffected, currentUser){
          // cria novo registro de sessão
          console.log("DEBUG: cria registro na sessão");
          var newUserSession = new UserSession({
            sender_id : currentUser.user_id,
            receiver_id : messagingEvent.recipient.id,
            body : JSON.stringify(messagingEvent.message),
            last_payload: payload
          });

          newUserSession.save(function(err, doc){
            handlehaveSession(err, doc, currentUser);
          });

        }

        function handlehaveSession(err, doc, currentUser){
          if(err) throw err //TODO:CATCH IT

          Message
          .find({"reference" : payload, "mismatch" : false})
          .sort({"order": 1})
          .exec(function(err, docs){
            handleFindMessageToSend(err, docs, currentUser)
          });
        }

        function handleFindMessageToSend(err, docs, currentUser){
          if(err) throw err;
          //console.log("DEBUG: busca mensagens com payload enviado. achou: " + docs.length);

          if(docs.length)
            prepareMessageToSend(docs, currentUser);
          else
            prepareErrorMessageToSend(currentUser);

        }

        function prepareMessageToSend(docs, currentUser){
          console.log("DEBUG: envia as mensagens cadastradas para o payload. total: " + docs.length);
          // envia todas para usuario
          docs.forEach(function (doc, index) {
            var messagejson = {
              recipient: {
                id: currentUser.user_id
              },
              message: JSON.parse(doc["body"])
            };

            enviarMensagem(currentUser, messagejson, doc, index);

          });
        }

        function prepareErrorMessageToSend(currentUser){
          UserSession.find({"receiver_id" : messagingEvent.sender.id}).sort({"createdAt" : -1}).limit(1).exec(function(err, usersession){//TODO: adicionar sort createdAt -1
            console.log("DEBUG: busca registro de sessão pela ultima mensagem enviada para o usuario. achou : " + usersession.length);
            if(usersession.length){
              //busca mensagem de erro comparando o ultimo payload enviado e mensagem que é mismatch
              Message.find({"reference" : usersession[0].last_payload, "mismatch" : true}).sort({"order": 1}).exec(function(err, messages){
                console.log("DEBUG: busca mensagem de erro resgitrada para aquele payload (" +usersession[0].last_payload+ ")  achou " + messages.length);
                console.log("DEBUG: LAST PAYLOAD",  usersession[0].last_payload);
                if(messages.length){
                  messages.forEach(function (message, index) {
                    var messagejson = {
                      recipient: {
                        id: currentUser.user_id
                      },
                      message: JSON.parse(message["body"])
                    };
                    console.log("DEBUG: envia mensagem para usuario");
                    enviarMensagem(currentUser, messagejson, message, index);
                  });

                }
              });
            }

          });

        }


        // busca mensagens com raference  = payload que usuario enviou

      }
      });

    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});



/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query['account_linking_token'];
  var redirectURI = req.query['redirect_uri'];

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;


  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  var payload = p =>  message.payload ? message.payload : message.text;


}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);



}

function enviarMensagem(currentUser, messagejson, message, index){

  var timeout = message.tempo ? message.tempo : 3000;
  var sjson = JSON.stringify(messagejson);

  var newUserSession = new UserSession({
    sender_id : "ROBOT",
    receiver_id : currentUser.user_id,
    body : JSON.stringify(messagejson),
    last_payload : message.reference
  });

  newUserSession.save(function(err){
    if(err) throw err

    if(sjson.match(/\(USER\)/g)){
      console.log("tem (USER) na mensagem");
      sjson = sjson.replace(/\(USER\)/g, currentUser.first_name);
      console.log("DEBUG: user : " + currentUser.first_name);
    }

    if(sjson.match(/\(PROGRESS\)/g)){
      console.log("tem (PROGRESS) na mensagem");
      sjson = sjson.replace(/\(PROGRESS\)/g, currentUser.progress);
      console.log("DEBUG: progress : " + currentUser.progress);
    }

    enviaMesmoAMensagem(currentUser, JSON.parse(sjson), index, timeout);


  });



}


function enviaMesmoAMensagem(currentUser, messagejson, index, timeout){
  setTimeout(function(){
    sendTypingOn(currentUser.user_id);
    sendTypingOff(currentUser.user_id);
    callSendAPI(messagejson);
  }, (index + 1 ) * timeout);
}


function getProgress(payload){
  switch (payload) {
    case 'START_BOT':
      return 10;
      break;
    case 'LEVEL_2':
        return 9;
        break;
    case 'LEVEL_3':
        return 8;
        break;
    case 'LEVEL_4':
        return 7;
        break;
    case 'LEVEL_5':
        return 6;
        break;
    case 'LEVEL_6':
        return 5;
        break;
    case 'LEVEL_7':
        return 4;
        break;
    case 'LEVEL_8':
        return 3;
        break;
    case 'LEVEL_9':
        return 2;
        break;
    case 'LEVEL_10':
        return 1;
        break;
    default:
      return 0;

  }
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPED_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",
          timestamp: "1428444852",
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}



/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {



  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {



    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;



      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s",
        recipientId);
      }
    } else {
      console.error("ERROR CAL SEND API ", response.body.error.message);
    }
  });
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



app.post('/insert_message', function(req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      //console.log("PAGE: ", pageEntry);
    });
  }


});







/**************************************
****************IDLES*****************
**************************************/

var user_data = {};
user_data.findById = function(user_id, callback){
  User.find({"user_id" : user_id}, callback);
}

user_data.findIdleUser = function(callback){

  UserSession.aggregate([
        // Sorting pipeline
        {

            "$match": {
                "last_payload": {"$nin" : [null, 'HELP', 'PROGRESS', 'DECO']}
            }
        },
        {
            "$sort": {
                "createdAt": -1
            }
        },
        // Grouping pipeline
        {
            "$group": {
                "_id": { "sender_id" : "$sender_id"},

                "createdAt": {
                    "$first": "$createdAt"
                },
                "last_payload" : {
                  	"$first" : "$last_payload",
                },
                "msg_id" : {
                  	"$first" : "$_id",
                }
                ,
                "idle10" : {
                  	"$first" : "$idle10",
                }
                ,
                "idle24" : {
                  	"$first" : "$idle24",
                }
                ,
                "idle72" : {
                  	"$first" : "$idle72",
                }
            }
        }
    ]).exec(callback);
}

var cron = require('node-cron');

var idles = cron.schedule('*/1 * * * *', function(){
  console.log('CRON: running a task every 1  minutes');
  //usuarios inativos por 10 min
  user_data.findIdleUser(function(err, sessions){
    if(sessions && sessions.length){
      console.log("DEBUG: achou usuarios : "+ sessions.length);
      sessions.forEach(function(session, index){
        if(!session.idle10){
          idle10(session);
        }else if(!session.idle24){
          idle24(session);
        }else if(!session.idle72){
          idle72(session);
        }
      });
    }
  });

});



function buscaMsgIdleEnvia(where, set, idle){
  //console.log("buscaMsgIdleEnvia");
  UserSession.findOneAndUpdate(where, set, {upsert: true}, function(err, doc){

    if(doc.sender_id != "ROBOT"){

      User.findOne({"user_id": doc.sender_id}, function(err, currentUser){
        //console.log("DEBUG: dentro : "+ idle);
        Idles.find({"reference" : doc.last_payload}).exec(function(err, messages){
          if(err) throw err;

          if(messages && messages.length){
            messages.forEach(function(message, index){
              var text;
              switch (idle) {
                case 'idle10':
                  text = message.idle10;
                  break;
                case 'idle24':
                  text = message.idle24;
                  break;
                case 'idle72':
                  text = message.idle72;
                  break;
                default:
                  text = message.idle72;
              }

              console.log("IDLE: "+ text);
                var messagejson = {

                  recipient: {
                    id: doc.sender_id
                  },
                  message: JSON.parse(text)
                };
                console.log("DEBUG: envia mensagem IDLE "+idle+" para usuario : " + doc.sender_id);
                currentUser.user_id = doc.sender_id;
                enviarMensagem(currentUser, messagejson, {tempo: null, reference : null}, 1);
                //callSendAPI(messagejson);

            });
          }
        });
      });
    }
  });
}

function idle72(session){
  //console.log("idle 72");
  var tresDiasAtras = new Date(Date.now() - 259200000);
  var where = {"_id" : session.msg_id};
  var set = {"idle72" : true};
  if(tresDiasAtras > session.createdAt){
    if(session.last_payload  != "VOTE_BOM" ||
     session.last_payload  != "VOTE_NORMAL" ||
     session.last_payload  != "VOTE_RUIM"){
       buscaMsgIdleEnvia(where, set, "idle72");
     }
  }else{
    //console.log("IDLE : ainda não ficou idle 72");
  }
}

function idle24(session){
  //console.log("idle 24");
  var umDiaAtras = new Date(Date.now() - 86400000);
  var where = {"_id" : session.msg_id};
  var set = {"idle24" : true};
  if(umDiaAtras > session.createdAt){
    if(session.last_payload  != "VOTE_BOM" ||
     session.last_payload  != "VOTE_NORMAL" ||
     session.last_payload  != "VOTE_RUIM"){
       buscaMsgIdleEnvia(where, set, "idle24");
     }
  }else{
    //console.log("IDLE: ainda não está idle 24")
  }
}

function idle10(session){
  //console.log("idle 10");
  var dezMinutosAtras = new Date(Date.now() - 10*60000);
  var where = {"_id" : session.msg_id};
  var set = {"idle10" : true};
  if(dezMinutosAtras > session.createdAt){
    if(session.last_payload  != "VOTE_BOM" ||
     session.last_payload  != "VOTE_NORMAL" ||
     session.last_payload  != "VOTE_RUIM"){
       buscaMsgIdleEnvia(where, set, "idle10");
     }
  }else{
    //console.log("IDLE: ainda não está idle 10");
  }
}



module.exports = app;
