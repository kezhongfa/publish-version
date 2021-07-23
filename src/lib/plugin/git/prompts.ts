import { format } from '@/helpers';
import { IOptions } from '../../../type';

export const prompts = {
  commit: {
    type: 'confirm',
    message: (context: IOptions) => `Commit (${format(context.git.commitMessage, context)})?`,
    default: true,
  },
  tag: {
    type: 'confirm',
    message: (context: IOptions) => `Tag (${format(context.git.tagName, context)})?`,
    default: true,
  },
  push: {
    type: 'confirm',
    message: () => 'Push?',
    default: true,
  },
};
