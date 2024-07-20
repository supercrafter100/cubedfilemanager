export interface Mutex {
    lock(): Promise<void>
    release(): void
}

export class Mutex {
    private lockQueue: (() => void)[] = [];
    public locked = false;

    lock(): Promise<void> {
        return new Promise(resolve => {
            if (this.locked) this.lockQueue.push(resolve);
            else {
                this.locked = true;
                resolve();
            }
        }) 
    }

    release() {
        if (this.lockQueue[0]) {
            setImmediate(() => this.lockQueue.shift()!());
        }
        else this.locked = false;
    }
}
