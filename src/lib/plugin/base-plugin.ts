import debug from 'debug';
import { get, merge } from 'lodash';
import { debugByNameSpace } from '@/helpers';
import { ENamespace, TContainer, IOptions } from '../../type';
import Prompt from '../prompt';
import Config from '../config';
import Log from '../log';
import Shell from '../shell';
import Spinner from '../spinner';

class BasePlugin<P = Record<string, any>, U = Record<string, any>> {
  debug: debug.Debugger;

  namespace: ENamespace;

  container: TContainer;

  prompt: Prompt;

  config: Config;

  log: Log;

  shell: Shell;

  spinner: Spinner;

  options: P;

  context: U;

  constructor({ namespace, container }: { namespace: ENamespace; container: TContainer }) {
    this.container = container;
    this.config = container.config;
    this.prompt = container.prompt;
    this.log = container.log;
    this.shell = container.shell;
    this.namespace = namespace;
    this.spinner = container.spinner;
    this.debug = debugByNameSpace(namespace);
    this.options = Object.freeze(this.getInitialOptions(this.config.options, namespace)) as unknown as P;
    this.context = {} as U;
  }

  getInitialOptions(options: IOptions, namespace: ENamespace) {
    return options[namespace] || {};
  }

  getContext(path?: any) {
    const context = Object.assign({}, this.options, this.context);
    return path ? get(context, path) : context;
  }

  setContext(context: U) {
    merge(this.context, context);
  }

  exec(command: string | string[], context?: Record<string, any>) {
    const ctx = Object.assign({}, context, this.config.getContext(), { [this.namespace]: this.getContext() });
    return this.shell.exec(command, ctx);
  }

  registerPrompts(prompts: any) {
    this.prompt.register(prompts, this.namespace);
  }

  async showPrompt(options: { enabled?: boolean; promptName: string; task: any; context?: Record<string, any> }) {
    const context = Object.assign({}, options.context, this.config.getContext(), {
      [this.namespace]: this.getContext(),
    });

    return this.prompt.show({
      ...options,
      context,
      namespace: this.namespace,
    });
  }
}

export default BasePlugin;
