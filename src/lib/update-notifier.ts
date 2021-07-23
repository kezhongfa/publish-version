import updateNotifier from 'update-notifier';
import pkg from '../../package.json';

// Checks for available update and returns an instance
const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 0,
}); // 1000 * 60 * 60 * 24(1 day)
// Notify using the built-in convenience method
notifier.notify();
