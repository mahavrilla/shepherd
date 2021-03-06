import * as util from "util";
import chalk from "chalk";
import { LogLevel, Logger, levelSatisfies, LogLabel } from "./log.interface";
import { padZero } from "../number/number";

export const enum NewLine {
  /**
   * Linux/Mac style new line.
   */
  LF = "\n",
  /**
   * Windows style new line.
   */
  CRLF = "\r\n",
}

export interface ConsoleLoggerOptions {
  withColor?: boolean;
  stream?: NodeJS.WriteStream;
  newLine?: NewLine;
}

/**
 * ConsoleLogger is an implementation of the Logger interface that just
 * delegates to various `console` methods. It uses methods as arrow function
 * properties so that all callers need not concern themselves with gotchas
 * around managing context for `this`.
 */
export class StreamLogger implements Logger {
  newLine: NewLine;
  withColor: boolean;
  stream: NodeJS.WriteStream;
  colorizers = {
    [LogLabel.Fatal]: chalk.red,
    [LogLabel.Error]: chalk.red,
    [LogLabel.Warn]: chalk.yellow,
    [LogLabel.Info]: chalk.cyan,
    [LogLabel.Debug]: chalk.white,
  };
  bgColorizers = {
    [LogLabel.Fatal]: chalk.bgRed,
    [LogLabel.Error]: chalk.bgRed,
    [LogLabel.Warn]: chalk.bgYellow,
    [LogLabel.Info]: chalk.bgCyan,
    [LogLabel.Debug]: chalk.bgWhite,
  };

  constructor(protected level: number, options: ConsoleLoggerOptions = {}) {
    let {
      withColor = false,
      stream = process.stderr,
      newLine = NewLine.LF,
    } = options;
    this.withColor = withColor;
    this.stream = stream;
    this.newLine = newLine;
  }

  protected write(label: LogLabel, ...values: any[]) {
    if (this.withColor) {
      this.stream.write(
        this.colorizers[label](util.format(this.prefix(label), ...values))
      );
    } else {
      this.stream.write(util.format(this.prefix(label), ...values));
    }
    this.stream.write(this.newLine);
  }

  protected prefix(label: LogLabel): string {
    let d = new Date();

    let YYYY = d.getFullYear();
    let MM = padZero(d.getMonth() + 1);
    let DD = padZero(d.getDate());

    let hh = padZero(d.getHours());
    let mm = padZero(d.getMinutes());
    let ss = padZero(d.getSeconds());

    let labelFmt = `[${label.toUpperCase()}]`;
    if (this.withColor) {
      labelFmt = chalk.bold(labelFmt);
      let colorizer = this.bgColorizers[label];
      switch (label) {
        case LogLabel.Debug:
        case LogLabel.Info:
          labelFmt = colorizer(chalk.black(labelFmt));
          break;
        default:
          labelFmt = colorizer(chalk.whiteBright(labelFmt));
          break;
      }
    }

    return `${labelFmt} [${YYYY}/${MM}/${DD} ${hh}:${mm}:${ss}]`;
  }

  fatal = (...values: any[]) => {
    if (!levelSatisfies(this.level, LogLevel.Fatal)) {
      return;
    }
    this.write(LogLabel.Fatal, ...values);
    /**
     * A fatal log is expected to terminate execution after logging its message.
     */
    process.exit(1);
  };

  error = (...values: any[]) => {
    if (!levelSatisfies(this.level, LogLevel.Error)) {
      return;
    }
    this.write(LogLabel.Error, ...values);
  };

  warn = (...values: any[]) => {
    if (!levelSatisfies(this.level, LogLevel.Warn)) {
      return;
    }
    this.write(LogLabel.Warn, ...values);
  };

  info = (...values: any[]) => {
    if (!levelSatisfies(this.level, LogLevel.Info)) {
      return;
    }
    this.write(LogLabel.Info, ...values);
  };

  debug = (...values: any[]) => {
    if (!levelSatisfies(this.level, LogLevel.Debug)) {
      return;
    }
    this.write(LogLabel.Debug, ...values);
  };
}
