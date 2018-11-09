/**
 * This file contains all of the web and hybrid functions for interacting with
 * Watson and the Watson Conversation service. When API calls are not needed, the
 * functions also do basic messaging between the client and the server.
 *
 * @summary   Functions for Watson Chat Bot.
 *
 * @link      cloudco.mybluemix.net
 * @since     0.0.3
 * @requires  app.js
 *
 */
var watson = require('watson-developer-cloud');
var CONVERSATION_NAME = "Conversation-Demo"; // conversation name goes here.
var fs = require('fs');
// load local VCAP configuration
var appEnv = null;
var conversationWorkspace, conversation;

// =====================================
// CREATE THE SERVICE WRAPPER ==========
// =====================================
// Create the service wrapper
    conversation = watson.conversation({
        url: "https://gateway.watsonplatform.net/conversation/api"
        , username: "746365a8-b621-4b45-ba10-9928baa3fdc7" // Replace <username>, including "<" and ">"
        , password: "DHtFLkaPsCvv" // Replace <password>, including "<" and ">"
        , version_date: '2018-11-10'
        , version: 'v1'
    });
    // check if the workspace ID is specified in the environment
    conversationWorkspace = "392cf707-d15e-4a63-b30e-4e49bd49567c"; // Replace <workspace_id>, including "<" and ">"
    // if not, look it up by name or create one
// Allow clients to interact

var chatbot = {
    sendMessage: function (req, callback) {
//        var owner = req.user.username;
        buildContextObject(req, function (err, params) {
                if (err) {
                    console.log("Erro ao criar o objeto de parâmetros: ", err);
                    return callback(err);
                }
                if (params.message) {
                    var conv = req.body.context.conversation_id;
                    var context = req.body.context;
                    var res = {
                        intents: []
                        , entities: []
                        , input: req.body.text
                        , output: {
                            text: params.message
                        }
                        , context: context
                    };
                    //                chatLogs(owner, conv, res, () => {
                    //                    return 
                    callback(null, res);
                    //                });
                }
                else if (params) {
                    // Send message to the conversation service with the current context
                    conversation.message(params, function (err, data) {
                            if (err) {
                                console.log("Erro ao enviar mensagem: ", err);
                                return callback(err);
                            }else{
                                
                            var conv = data.context.conversation_id;
                            console.log("Resposta da Watson: ", JSON.stringify(data));
//                            if (data.context.system.dialog_turn_counter > 1) {
//                                chatLogs(owner, conv, data, () => {
//                                    return callback(null, data);
//                                });
//                            }
//                            else {
                                return callback(null, data);
//                            }
                        }
                    });
            }
        });
}
};
// ===============================================
// LOG MANAGEMENT FOR USER INPUT FOR WATSON =========
// ===============================================
function chatLogs(owner, conversation, response, callback) {
    console.log("O objeto de resposta é: ", response);
    // Blank log file to parse down the response object
    var logFile = {
        inputText: ''
        , responseText: ''
        , entities: {}
        , intents: {}
    , };
    logFile.inputText = response.input.text;
    logFile.responseText = response.output.text;
    logFile.entities = response.entities;
    logFile.intents = response.intents;
    logFile.date = new Date();
    var date = new Date();
    var doc = {};
    Logs.find({
        selector: {
            'conversation': conversation
        }
    }, function (err, result) {
        if (err) {
            console.log("Não foi possível encontrar os logs.");
            callback(null);
        }
        else {
            doc = result.docs[0];
            if (result.docs.length === 0) {
                console.log("Sem log. Criando um novo.");
                doc = {
                    owner: owner
                    , date: date
                    , conversation: conversation
                    , lastContext: response.context
                    , logs: []
                };
                doc.logs.push(logFile);
                Logs.insert(doc, function (err, body) {
                    if (err) {
                        console.log("Houve um erro ao criar o log:", err);
                    }
                    else {
                        console.log("Log bem sucedido criado: ", body);
                    }
                    callback(null);
                });
            }
            else {
                doc.lastContext = response.context;
                doc.logs.push(logFile);
                Logs.insert(doc, function (err, body) {
                    if (err) {
                        console.log("Houve um erro ao atualizar o log: ", err);
                    }
                    else {
                        console.log("Log bem sucedido atualizado: ", body);
                    }
                    callback(null);
                });
            }
        }
    });
}
// ===============================================
// UTILITY FUNCTIONS FOR CHATBOT AND LOGS ========
// ===============================================
/**
 * @summary Form the parameter object to be sent to the service
 *
 * Update the context object based on the user state in the conversation and
 * the existence of variables.
 *
 * @function buildContextObject
 * @param {Object} req - Req by user sent in POST with session and user message
 */
function buildContextObject(req, callback) {
    var message = req.body.text;
//    var userTime = req.body.user_time;
    var context;
    if (!message) {
        message = '';
    }
    // Null out the parameter object to start building
    var params = {
        workspace_id: conversationWorkspace
        , input: {}
        , context: {}
    };

    
    if (req.body.context) {
        context = req.body.context;
        params.context = context;
    }
    else {
        context = '';
    }
    // Set parameters for payload to Watson Conversation
    params.input = {
        text: message // User defined text to be sent to service
    };
    // This is the first message, add the user's name and get their healthcare object
//    if ((!message || message === '') && !context) {
//        params.context = {
//            fname: req.user.fname
//            , lname: req.user.lname
//        };
//    }
    return callback(null, params);
}
module.exports = chatbot;
