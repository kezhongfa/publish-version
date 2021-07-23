/* eslint-disable no-return-await */
import inquirer from 'inquirer';
import { TContainer } from '../type';
import Config from './config';

class Prompt {
  createPrompt: inquirer.PromptModule;

  prompts: Record<string, any>;

  config: Config;

  constructor(container: TContainer) {
    this.createPrompt = inquirer.prompt;
    this.config = container.config;
    this.prompts = {};
  }

  register(pluginPrompts: Record<string, any>, namespace = 'default') {
    this.prompts[namespace] = this.prompts[namespace] || {};
    Object.assign(this.prompts[namespace], pluginPrompts);
  }

  async show({
    enabled = true,
    promptName,
    namespace = 'default',
    task,
    context = this.config.getContext(),
  }: {
    enabled?: boolean;
    promptName: string;
    namespace?: string;
    task: (v?: any) => void | any;
    context?: Record<string, any>;
  }) {
    if (!enabled) return false;

    const prompt = this.prompts[namespace][promptName];
    const options = Object.assign({}, prompt, {
      name: promptName,
      message: prompt.message(context),
      choices: 'choices' in prompt ? prompt.choices(context) : undefined,
      transformer: 'transformer' in prompt ? prompt.transformer(context) : undefined,
      filter: 'filter' in prompt ? prompt.filter(context) : undefined,
    });

    const answers = await this.createPrompt([options]);

    const doExecute = prompt.type === 'confirm' ? answers[promptName] : true;

    return doExecute && task ? await task(answers[promptName]) : false;
  }
}

export default Prompt;
