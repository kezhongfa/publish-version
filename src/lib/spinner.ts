import ora from 'ora';
import { format, noop } from '@/helpers';
import { TContainer } from '../type';
import Config from './config';

class Spinner {
  ora;

  config: Config;

  constructor(container: TContainer) {
    this.config = container.config;
    this.ora = ora;
  }

  show({
    enabled = true,
    task,
    label: l,
    context = this.config.getContext(),
  }: {
    enabled?: boolean;
    task: () => Promise<unknown>;
    label?: string;
    context?: Record<string, any>;
  }) {
    if (!enabled) return noop;
    const awaitTask = task();

    const label = l && l.endsWith('\n') ? l : `${l}\n`;
    const text = format(label, context);
    this.ora.promise(awaitTask, text);
    return awaitTask;
  }
}

export default Spinner;
