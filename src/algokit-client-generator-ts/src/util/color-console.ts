import chalk from 'chalk'

type ColorFn = (text: string) => string

const createColorFormatter =
  (textColor: ColorFn, argColor: ColorFn, consoleFn: 'log' | 'error' | 'info' | 'warn') =>
  (textParts: TemplateStringsArray, ...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console[consoleFn](
      textParts
        .flatMap((t, i) => (args.length > i ? [textColor(t), argColor(`${args[i]}`)] : textColor(t)))
        .reduce((acc, cur) => acc + cur, ''),
    )
  }

export const colorConsole = {
  info: createColorFormatter(chalk.cyan, chalk.blue, 'info'),
  warn: createColorFormatter(chalk.yellow, chalk.yellow.bold, 'warn'),
  success: createColorFormatter(chalk.green, chalk.green.bold, 'info'),
  error: createColorFormatter(chalk.red, chalk.red.bold, 'error'),
}
