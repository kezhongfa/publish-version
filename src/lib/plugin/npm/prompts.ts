import { IOptions } from '../../../type';

export const prompts = {
  publish: {
    type: 'confirm',
    message: (context: IOptions) =>
      `Publish ${context.npm.name}${context.npm.tag === 'latest' ? '' : `@${context.npm.tag}`} to npm?`,
    default: true,
  },
};
