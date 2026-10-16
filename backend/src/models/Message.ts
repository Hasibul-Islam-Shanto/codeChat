import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: IToolCall[];
  toolCallId?: string;
  createdAt: Date;
}

const toolCallSchema = new Schema<IToolCall>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['function'], default: 'function' },
    function: {
      name: { type: String, required: true },
      arguments: { type: String, required: true },
    },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'tool'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    toolCalls: {
      type: [toolCallSchema],
      default: undefined,
    },
    toolCallId: {
      type: String,
      default: undefined,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
