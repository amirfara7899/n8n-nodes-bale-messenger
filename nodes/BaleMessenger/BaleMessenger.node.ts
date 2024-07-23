import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject, NodeOperationError,
	// NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';
import {BINARY_ENCODING, IExecuteFunctions} from 'n8n-core';
import {default as TelegramBot, InlineQueryResult} from 'node-telegram-bot-api';

const BALE_API_URL = `https://tapi.bale.ai/bot`;

function getMarkup(this: IExecuteFunctions, i: number) {
	const replyMarkupOption = this.getNodeParameter('replyMarkup', i) as string;
	let reply_markup: any = {};

	if (replyMarkupOption === 'none') {
		return undefined;
	} else if (replyMarkupOption === 'forceReply') {
		return this.getNodeParameter('forceReply', i);
	} else if (replyMarkupOption === 'replyKeyboardRemove') {
		return this.getNodeParameter('replyKeyboardRemove', i);
	}

	let setParameterName = 'inline_keyboard';
	if (replyMarkupOption === 'replyKeyboard') {
		setParameterName = 'keyboard';
	}

	reply_markup[setParameterName] = [];

	const keyboardData = this.getNodeParameter(replyMarkupOption, i) as any;
	for (const row of keyboardData.rows) {
		const sendRows: any[] = [];
		if (row.row?.buttons === undefined) {
			continue;
		}
		for (const button of row.row.buttons) {
			let sendButtonData: any = {};
			sendButtonData.text = button.text;
			if (button.additionalFields) {
				Object.assign(sendButtonData, button.additionalFields);
			}
			sendRows.push(sendButtonData);
		}
		reply_markup[setParameterName].push(sendRows);
	}

	return reply_markup;
}

async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string): Promise<any> {
	const data: Record<string, any> = {callback_query_id: callbackQueryId};
	if (text) {
		data.text = text;
	}

	// Log the URL to ensure it's correct
	const url = `${BALE_API_URL}${token}/answerCallbackQuery`;
	console.log('Request URL:', url);
	console.log('Request Data:', data);

	try {
		const response = await axios.post(url, data, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
		console.log('Response from Bale:', response.data);
		return response.data;
	} catch (error) {
		console.error('Failed to answer callback query:', error.response ? error.response.data : error.message);
		throw error;
	}
}

async function sendContact(token: string, chat_id: string, phone_number: string, first_name: string,
													 last_name?: string, replyToMessageId?: number, reply_markup?: any) {
	const data: Record<string, any> = {
		chat_id: chat_id,
		phone_number: phone_number,
		first_name: first_name,
		last_name: last_name,
		replyToMessageId: replyToMessageId,
		reply_markup: reply_markup
	};
	const url = `${BALE_API_URL}${token}/sendContact`;
	try {
		const response = await axios.post(url, data, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
		console.log('Response from Bale:', response.data);
		return response.data;
	} catch (error) {
		console.error('Failed to send contact:', error.response ? error.response.data : error.message);
		throw error;
	}
}

export class BaleMessenger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BaleMessenger',
		name: 'baleMessenger',
		icon: 'file:bale.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Bale Messenger API',
		defaults: {
			name: 'BaleMessenger',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'baleMessengerApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Bot',
						value: 'bot'
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Callback',
						value: 'callback',
					},
				],
				default: 'message',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['bot'],
					},
				},
				options: [
					{
						name: 'Get Me',
						value: 'getMe',
						description: 'A simple method for testing your bots auth token',
						action: 'Test bot auth token',
					},
					{
						name: 'Log Out',
						value: 'logOut',
						description: 'Log out from the cloud Bot API server before launching the bot locally',
						action: 'Log out from the cloud bot api',
					},
					{
						name: 'Close',
						value: 'close',
						description: 'Close the bot instance before moving it from one local server to another',
						action: 'Close the bot instance',
					},
				],
				default: 'getMe'
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Copy Message',
						value: 'copyMessage',
						description: 'Copy a message',
						action: 'Copy a message',
					},
					{
						name: 'Delete Chat Message',
						value: 'deleteMessage',
						description: 'Delete a chat message',
						action: 'Delete a chat message',
					},
					{
						name: 'Edit Message Text',
						value: 'editMessageText',
						description: 'Edit a text message',
						action: 'Edit a test message',
					},
					{
						name: 'Forward Message',
						value: 'forwardMessage',
						description: 'Forward a message',
						action: 'Forward a message'
					},
					{
						name: 'Send Animation',
						value: 'sendAnimation',
						description: 'Send an animated file',
						action: 'Send an animated file',
					},
					{
						name: 'Send Audio',
						value: 'sendAudio',
						description: 'Send an audio file',
						action: 'Send an audio file',
					},
					{
						name: 'Send Chat Action',
						value: 'sendChatAction',
						description: 'Send a chat action',
						action: 'Send a chat action',
					},
					{
						name: 'Send Contact',
						value: 'sendContact',
						description: 'Send a contact',
						action: 'Send a contact',
					},
					{
						name: 'Send Document',
						value: 'sendDocument',
						description: 'Send a document',
						action: 'Send a document',
					},
					{
						name: 'Send Location',
						value: 'sendLocation',
						description: 'Send a location',
						action: 'Send a location',
					},
					{
						name: 'Send Media Group',
						value: 'sendMediaGroup',
						description: 'Send group of photos or videos to album',
						action: 'Send a media group message',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a text message',
						action: 'Send a text message',
					},
					{
						name: 'Send Photo',
						value: 'sendPhoto',
						description: 'Send a photo',
						action: 'Send a photo message',
					},
					{
						name: 'Send Sticker',
						value: 'sendSticker',
						description: 'Send a sticker',
						action: 'Send a sticker',
					},
					{
						name: 'Send Video',
						value: 'sendVideo',
						description: 'Send a video',
						action: 'Send a video',
					},
					{
						name: 'Send Voice',
						value: 'sendVoice',
						description: 'Send a voice',
						action: 'Send a voice',
					},
				],

				default: 'sendMessage',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['callback'],
					},
				},
				options: [
					{
						name: 'Answer Query',
						value: 'answerQuery',
						description: 'Send answer to callback query sent from inline keyboard',
						action: 'Answer a query callback',
					},
					{
						name: 'Answer Inline Query',
						value: 'answerInlineQuery',
						description: 'Send answer to callback query sent from inline bot',
						action: 'Answer an inline query callback',
					},
				],
				default: 'answerQuery',
			},

			// edit message
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Inline Message',
						value: 'inlineMessage',
					},
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
				description: 'The type of the message to edit',
			},
			{
				displayName: 'Inline Message ID',
				name: 'inlineMessageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						messageType: ['inlineMessage'],
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				required: true,
				description: 'Unique identifier of the inline message to edit',
			},
			{
				displayName: 'Disable Notification',
				name: 'disable_notification',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['editMessageText'],
					},
				},
				description:
					'Whether to send the message silently. Users will receive a notification with no sound.',
			},
			// edit message

			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'sendDocument',
							'sendMessage',
							'sendPhoto',
							'sendAudio',
							'sendVoice',
							'sendVideo',
							'sendAnimation',
							'sendMediaGroup',
							'sendSticker',
							'deleteMessage',
							'sendChatAction',
							'editMessageText',
							'sendLocation',
							'sendContact',
							'copyMessage',
							'forwardMessage',
						],
						resource: ['chat', 'message'],
					},
				},
				required: true,
				description: 'Unique identifier for the target chat',
			},

			{
				displayName: 'From Chat ID',
				name: 'fromChatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'copyMessage',
							'forwardMessage',
						],
						resource: ['chat', 'message'],
					},
				},
				required: true,
				description: 'Unique identifier for the chat where the original message was sent',
			},

			{
				displayName: 'Binary Data',
				name: 'binaryData',
				type: 'boolean',
				default: false,
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument', 'sendPhoto', 'sendAudio', 'sendVideo', 'sendAnimation', 'sendVoice'],
						resource: ['message'],
					},
				},
				description: 'Whether the data to upload should be taken from binary field',
			},

			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendDocument', 'sendPhoto', 'sendAudio', 'sendVoice', 'sendVideo', 'sendAnimation', 'sendSticker'],
						resource: ['message'],
						binaryData: [true],
					},
				},
				placeholder: '',
				description: 'Name of the binary property that contains the data to upload',
			},

			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendDocument', 'sendPhoto', 'sendAudio', 'sendVoice', 'sendVideo', 'sendAnimation'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description: 'Pass a file_id to send a file that exists on the Bale servers',
			},

			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendMessage', 'editMessageText'],
						resource: ['message'],
					},
				},
				description: 'Text of the message to be sent',
			},

			{
				displayName: 'Reply Markup',
				name: 'replyMarkup',
				displayOptions: {
					show: {
						operation: [
							'sendDocument',
							'sendMessage',
							'sendPhoto',
							'sendAudio',
							'sendVoice',
							'sendVideo',
							'sendAnimation',
							'editMessageText',
							'sendLocation',
							'sendContact',
						],
						resource: ['message'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'Inline Keyboard',
						value: 'inlineKeyboard',
					},
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'Reply Keyboard',
						value: 'replyKeyboard',
					},
					{
						name: 'Reply Keyboard Remove',
						value: 'replyKeyboardRemove',
					},
				],
				default: 'none',
				description: 'Additional interface options',
			},

			{
				displayName: 'Inline Keyboard',
				name: 'inlineKeyboard',
				placeholder: 'Add Keyboard Row',
				description: 'Adds an inline keyboard that appears right next to the message it belongs to',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						replyMarkup: ['inlineKeyboard'],
						resource: ['message'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Rows',
						name: 'rows',
						values: [
							{
								displayName: 'Row',
								name: 'row',
								type: 'fixedCollection',
								description: 'The value to set',
								placeholder: 'Add Button',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										displayName: 'Buttons',
										name: 'buttons',
										values: [
											{
												displayName: 'Text',
												name: 'text',
												type: 'string',
												default: '',
												description: 'Label text on the button',
											},
											{
												displayName: 'Additional Fields',
												name: 'additionalFields',
												type: 'collection',
												placeholder: 'Add Field',
												default: {},
												options: [
													{
														displayName: 'Callback Data',
														name: 'callback_data',
														type: 'string',
														default: '',
														description:
															'Data to be sent in a callback query to the bot when button is pressed, 1-64 bytes',
													},
													{
														displayName: 'URL',
														name: 'url',
														type: 'string',
														default: '',
														description: 'HTTP or tg:// URL to be opened when button is pressed',
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			},

			{
				displayName: 'Reply Keyboard',
				name: 'replyKeyboard',
				placeholder: 'Add Reply Keyboard Row',
				description: 'Adds a custom keyboard with reply options',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						replyMarkup: ['replyKeyboard'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Rows',
						name: 'rows',
						values: [
							{
								displayName: 'Row',
								name: 'row',
								type: 'fixedCollection',
								description: 'The value to set',
								placeholder: 'Add Button',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										displayName: 'Buttons',
										name: 'buttons',
										values: [
											{
												displayName: 'Text',
												name: 'text',
												type: 'string',
												default: '',
												description:
													'Text of the button. If none of the optional fields are used, it will be sent as a message when the button is pressed.',
											},
										],
									},
								],
							},
						],
					},
				],
			},

			{
				displayName: 'Reply Keyboard Remove',
				name: 'replyKeyboardRemove',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						replyMarkup: ['replyKeyboardRemove'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Remove Keyboard',
						name: 'remove_keyboard',
						type: 'boolean',
						default: false,
						description: 'Whether to request clients to remove the custom keyboard',
					},
					{
						displayName: 'Selective',
						name: 'selective',
						type: 'boolean',
						default: false,
						description: 'Whether to force reply from specific users only',
					},
				],
			},
			// amir nezami changes starts here \\
			{
				displayName: 'Reply To Message ID',
				name: 'replyToMessageId',
				type: 'number',
				displayOptions: {
					show: {
						operation: [
							'sendDocument',
							'sendMessage',
							'sendPhoto',
							'sendAudio',
							'sendVoice',
							'sendVideo',
							'sendAnimation',
							'sendMediaGroup',
							'sendSticker',
							'sendContact',
						],
						resource: ['chat', 'message'],
					},
				},
				default: 0,
				description: 'If the message is a reply, ID of the original message',
			},
			{
				displayName: 'Sticker ID',
				name: 'stickerId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendSticker'],
						resource: ['message'],
					},
				},
				description:
					'Sticker to send. Pass a file_id to send a file that exists on the Bale servers (recommended).',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['deleteMessage', 'editMessageText', 'copyMessage', 'forwardMessage'],
						resource: ['message'],
					},
				},
				required: true,
				description: 'Unique identifier of the message to delete',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['sendChatAction'],
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Find Location',
						value: 'find_location',
						action: 'Find location',
					},
					{
						name: 'Record Audio',
						value: 'record_audio',
						action: 'Record audio',
					},
					{
						name: 'Record Video',
						value: 'record_video',
						action: 'Record video',
					},
					{
						name: 'Record Video Note',
						value: 'record_video_note',
						action: 'Record video note',
					},
					{
						name: 'Typing',
						value: 'typing',
						action: 'Typing a message',
					},
					{
						name: 'Upload Audio',
						value: 'upload_audio',
						action: 'Upload audio',
					},
					{
						name: 'Upload Document',
						value: 'upload_document',
						action: 'Upload document',
					},
					{
						name: 'Upload Photo',
						value: 'upload_photo',
						action: 'Upload photo',
					},
					{
						name: 'Upload Video',
						value: 'upload_video',
						action: 'Upload video',
					},
					{
						name: 'Upload Video Note',
						value: 'upload_video_note',
						action: 'Upload video note',
					},
				],
				default: 'typing',
				description:
					'Type of action to broadcast. Choose one, depending on what the user is about to receive. The status is set for 5 seconds or less (when a message arrives from your bot).',
			},
			// amir nezami changes ends here \\

			// ----------------------------------
			//         message:sendContact
			// ----------------------------------
			{
				displayName: 'Phone Number',
				name: 'phone_number',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				placeholder: '+989123456789',
				description: 'Phone number of the contact to be sent',
			},

			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				description: 'First name of the contact to be sent',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				description: 'Last name of the contact to be sent',
			},

			// ----------------------------------
			//         message:sendLocation
			// ----------------------------------
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0.0,
				typeOptions: {
					numberPrecision: 10,
					minValue: -90,
					maxValue: 90,
				},
				displayOptions: {
					show: {
						operation: ['sendLocation'],
						resource: ['message'],
					},
				},
				description: 'Location latitude',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				typeOptions: {
					numberPrecision: 10,
					minValue: -180,
					maxValue: 180,
				},
				default: 0.0,
				displayOptions: {
					show: {
						operation: ['sendLocation'],
						resource: ['message'],
					},
				},
				description: 'Location longitude',
			},
			{
				displayName: 'Horizontal Accuracy',
				name: 'horizontal_accuracy',
				type: 'number',
				typeOptions: {
					numberPrecision: 10,
					minValue: 0,
					maxValue: 1500,
				},
				default: 0.0,
				displayOptions: {
					show: {
						operation: ['sendLocation'],
						resource: ['message'],
					},
				},
				description: 'Location horizontal accuracy',
			},

			// ----------------------------------
			//         callback:answerQuery
			// ----------------------------------
			{
				displayName: 'Query ID',
				name: 'queryId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['answerQuery'],
						resource: ['callback'],
					},
				},
				required: true,
				description: 'Unique identifier for the query to be answered',
			},

			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['answerQuery'],
						resource: ['callback'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Cache Time',
						name: 'cache_time',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'The maximum amount of time in seconds that the result of the callback query may be cached client-side',
					},
					{
						displayName: 'Show Alert',
						name: 'show_alert',
						type: 'boolean',
						default: false,
						description:
							'Whether an alert will be shown by the client instead of a notification at the top of the chat screen',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description:
							'Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters.',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: "URL that will be opened by the user's client",
					},
				],
			},

			// -----------------------------------------------
			//         callback:answerInlineQuery
			// -----------------------------------------------
			{
				displayName: 'Query ID',
				name: 'queryId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
						resource: ['callback'],
					},
				},
				required: true,
				description: 'Unique identifier for the answered query',
			},
			{
				displayName: 'Results',
				name: 'results',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
						resource: ['callback'],
					},
				},
				required: true,
				description: 'A JSON-serialized array of results for the inline query',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
						resource: ['callback'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Cache Time',
						name: 'cache_time',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'The maximum amount of time in seconds that the result of the callback query may be cached client-side',
					},
					{
						displayName: 'Show Alert',
						name: 'show_alert',
						type: 'boolean',
						default: false,
						description:
							'Whether an alert will be shown by the client instead of a notification at the top of the chat screen',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description:
							'Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters.',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: "URL that will be opened by the user's client",
					},
				],
			},


			// -----------------------------------------------
			//         message: sendMediaGroup
			// -----------------------------------------------
			{
				displayName: 'Media',
				name: 'media',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						operation: ['sendMediaGroup'],
						resource: ['message'],
					},
				},
				description: 'The media to add',
				placeholder: 'Add Media',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Media',
						name: 'media',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Photo',
										value: 'photo',
									},
									{
										name: 'Video',
										value: 'video',
									},
								],
								default: 'photo',
								description: 'The type of the media to add',
							},
							{
								displayName: 'Media File',
								name: 'media',
								type: 'string',
								default: '',
								description:
									'Media to send. Pass a file_id to send a file that exists on the Telegram servers (recommended) or pass an HTTP URL for Telegram to get a file from the Internet.',
							},
							{
								displayName: 'Additional Fields',
								name: 'additionalFields',
								type: 'collection',
								placeholder: 'Add Field',
								default: {},
								options: [
									{
										displayName: 'Caption',
										name: 'caption',
										type: 'string',
										default: '',
										description: 'Caption text to set, 0-1024 characters',
									},
									{
										displayName: 'Parse Mode',
										name: 'parse_mode',
										type: 'options',
										options: [
											{
												name: 'Markdown (Legacy)',
												value: 'Markdown',
											},
											{
												name: 'MarkdownV2',
												value: 'MarkdownV2',
											},
											{
												name: 'HTML',
												value: 'HTML',
											},
										],
										default: 'HTML',
										description: 'How to parse the text',
									},
								],
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const resource = this.getNodeParameter('resource', 0);
		const credentials = await this.getCredentials('baleMessengerApi');
		const binaryData = this.getNodeParameter('binaryData', 0, false);

		const bot = new TelegramBot(credentials.token as string, {
			baseApiUrl: 'https://tapi.bale.ai',
		});

		let body: IDataObject;

		for (let i = 0; i < items.length; i++) {
			body = {};

			if (resource === 'bot') {

				if (operation === 'getMe') {
					const res = await bot.getMe();
					returnData.push({
						json: {
							...res
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (operation === 'logOut') {
					const res = await bot.logOut();
					returnData.push({
						json: {
							logged_out: res,
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (operation === 'close') {
					const res = await bot.close();
					returnData.push({
						json: {
							closed: res,
						},
						binary: {},
						pairedItem: {item: i},
					});
				}
			} else if (resource === 'callback') {
				if (operation === 'answerQuery') {
					// ----------------------------------
					//         callback:answerQuery
					// ----------------------------------

					const query_id = this.getNodeParameter('queryId', i) as string;

					// Add additional fields
					// const additionalFields = this.getNodeParameter('additionalFields', i);
					try {
						const res = await answerCallbackQuery(credentials.token as string, query_id, "amir");
						returnData.push({
							json: {
								successful: res,
							},
							binary: {},
							pairedItem: {item: i},
						});
					} catch (error) {
						// Log the error for debugging purposes
						console.error('Error answering callback query:', error);
						// Optionally, you can add more information to the returned data for further inspection
						returnData.push({
							json: {
								successful: false,
								errorMessage: error.message,
								errorDetails: error.response ? error.response.data : {},
							},
							binary: {},
							pairedItem: {item: i},
						});
					}
				} else if (operation === 'answerInlineQuery') {
					// -----------------------------------------------
					//         callback:answerInlineQuery
					// -----------------------------------------------

					const query_id = this.getNodeParameter('queryId', i) as string;
					const resultsParam = this.getNodeParameter('results', i) as string;
					let results: InlineQueryResult[] = [];

					try {
						results = JSON.parse(resultsParam) as InlineQueryResult[];
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'The results parameter is not a valid JSON string.', {
							itemIndex: i,
						});
					}

					// Log the parsed results for debugging
					console.log('Parsed results:', JSON.stringify(results, null, 2));

					// Add additional fields
					const additionalFields = this.getNodeParameter('additionalFields', i) || {};

					try {
						// Log the payload being sent to Telegram API
						console.log('Sending answerInlineQuery request with:', JSON.stringify({
							query_id,
							results,
							additionalFields
						}, null, 2));

						// Send request to Telegram API
						const res = await bot.answerInlineQuery(query_id, results, additionalFields);

						// Log the response from Telegram API
						console.log('Received response:', res);

						returnData.push({
							json: {
								successful: res,
							},
							binary: {},
							pairedItem: {item: i},
						});
					} catch (error) {
						// Log the error for debugging
						console.error('Failed to answer inline query:', error);

						throw new NodeOperationError(this.getNode(), `Failed to answer inline query: ${error.message}`, {
							itemIndex: i,
							...error,
						});
					}
				}

			} else if (resource === 'message') {
				const chatId = this.getNodeParameter('chatId', i) as string;

				if (operation === 'sendMessage') {
					try {
						const text = this.getNodeParameter('text', i) as string;

						const res = await bot.sendMessage(chatId, text, {
							reply_markup: getMarkup.call(this, i),
						});
						returnData.push({
							json: {
								...res,
							},
							binary: {},
							pairedItem: {item: i},
						});

					} catch (err) {

						//throw new NodeOperationError(this.getNode(), `bad request - chat not found`);
					}
				} else if (operation === 'editMessageText') {
					const messageType = this.getNodeParameter('messageType', i) as string;
					let chat_id;
					let message_id;
					let Text;
					if (messageType === 'inlineMessage') {
						body.inline_message_id = this.getNodeParameter('inlineMessageId', i) as string;
					} else {
						chat_id = this.getNodeParameter('chatId', i) as string;
						message_id = this.getNodeParameter('messageId', i) as number;
						// reply_markup = this.getNodeParameter('replyMarkup', i) as InlineKeyboardMarkup;
					}

					body.text = this.getNodeParameter('text', i) as string;
					Text = body.text;

					bot.editMessageText(body.text, {
						chat_id: chat_id,
						message_id: message_id,
						reply_markup: getMarkup.call(this, i),
					});

					returnData.push({
						json: {
							Text,
							chat_id,
							message_id,
						},
						binary: {},
						pairedItem: {item: i},
					});

					// Add additional fields and replyMarkup
					// addAdditionalFields.call(this, body, i);
				} else if (operation === 'sendSticker') {
					const stickerId = this.getNodeParameter('stickerId', i) as string;
					const replyToMessageId = this.getNodeParameter('replyToMessageId', i) as number;

					const res = await bot.sendSticker(chatId, stickerId, {
						reply_to_message_id: replyToMessageId,
					});

					returnData.push({
						json: {
							...res,
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (operation === 'deleteMessage') {
					const messageId = this.getNodeParameter('messageId', i) as number;

					await bot.deleteMessage(chatId, messageId);

					returnData.push({
						json: {
							messageDeleted: true,
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (operation === 'copyMessage') {
					const fromChatId = this.getNodeParameter('fromChatId', i) as string;
					const messageId = this.getNodeParameter('messageId', i) as number;

					const res = bot.copyMessage(chatId, fromChatId, messageId);

					returnData.push({
						json: {
							messageId: res,
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (operation === 'forwardMessage') {
					const fromChatId = this.getNodeParameter('fromChatId', i) as string;
					const messageId = this.getNodeParameter('messageId', i) as number;

					const res = bot.forwardMessage(chatId, fromChatId, messageId);

					returnData.push({
						json: {
							res: res,
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (['sendDocument', 'sendPhoto', 'sendAudio', 'sendVoice', 'sendVideo', 'sendAnimation'].includes(operation)) {
					let fileOptions = undefined;
					let uploadData = undefined
					const options = {reply_markup: getMarkup.call(this, i)};
					if (binaryData) {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
						const itemBinaryData = items[i].binary![binaryPropertyName];
						uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
						fileOptions = {filename: itemBinaryData.fileName};
					} else {
						// file_id passed
						uploadData = this.getNodeParameter('fileId', 0) as string;
					}
					if (operation === 'sendDocument')
						await bot.sendDocument(chatId, uploadData, options, fileOptions);
					else if (operation === 'sendPhoto')
						await bot.sendPhoto(chatId, uploadData, options, fileOptions);
					else if (operation === 'sendAudio')
						await bot.sendAudio(chatId, uploadData, options, fileOptions);
					else if (operation === 'sendVoice')
						await bot.sendVoice(chatId, uploadData, options, fileOptions);
					else if (operation === 'sendVideo')
						await bot.sendVideo(chatId, uploadData, options, fileOptions);
					else if (operation === 'sendAnimation')
						await bot.sendAnimation(chatId, uploadData, options)

				} else if (operation === 'sendMediaGroup') {
					const mediaItems = this.getNodeParameter('media', i) as IDataObject;
					const replyToMessageId = this.getNodeParameter('replyToMessageId', i) as number;

					const body: any = {
						media: [],
					};
					for (const mediaItem of mediaItems.media as IDataObject[]) {
						if (mediaItem.additionalFields !== undefined) {
							Object.assign(mediaItem, mediaItem.additionalFields);
							delete mediaItem.additionalFields;
						}
						body.media.push(mediaItem);
					}

					await bot.sendMediaGroup(chatId, body.media, {
						reply_to_message_id: replyToMessageId,
					})
				} else if (operation === 'sendLocation') {
					const latitude = this.getNodeParameter('latitude', i) as number;
					const longitude = this.getNodeParameter('longitude', i) as number;
					const horizontal_accuracy = this.getNodeParameter('horizontal_accuracy', i) as number;
					const res = await bot.sendLocation(chatId, latitude, longitude, {
						horizontal_accuracy: horizontal_accuracy,
					})
					returnData.push({
						json: {
							...res,
						},
						binary: {},
						pairedItem: {item: i},
					});
				} else if (operation === 'sendContact') {
					const phone_number = this.getNodeParameter('phone_number', i) as string;
					const first_name = this.getNodeParameter('first_name', i) as string;
					const last_name = this.getNodeParameter('last_name', i) as string;
					const replyToMessageId = this.getNodeParameter('replyToMessageId', i) as number;
					const reply_markup = getMarkup.call(this, i);

					const res = await sendContact(credentials.token as string, chatId, phone_number,
						first_name, last_name, replyToMessageId, reply_markup);
					returnData.push({
						json: {
							...res,
						},
						binary: {},
						pairedItem: {item: i},
					});

				}
			}
		}
		return this.prepareOutputData(returnData);
	}
}
