import {Spinner as PicoSpinner} from "picospinner";
import chalk from "chalk";

export default class Spinner extends PicoSpinner {
    constructor(text: string) {
        super({
            text: chalk.gray(text), 
            symbolFormatter: symbol => ' ' + chalk.blue(symbol)
        });
    }
}