import {
    animate,
    AnimationEvent,
    state,
    style,
    transition,
    trigger
} from '@angular/animations';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    createComponent,
    createEnvironmentInjector,
    EnvironmentInjector,
    HostListener,
    Inject,
    Injectable,
    Input,
    OnDestroy,
    OnInit,
    Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {
    first,
    Observable,
    ReplaySubject,
    share,
    Subject,
    takeUntil
} from 'rxjs';

const animations = [
    trigger('inOutAnimation', [
        state(
                'void',
                style({
                    transform: 'translateY(10%)',
                    opacity: 0
                })
        ),
        transition('void => open', [
            animate(
                    '0.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    style({ opacity: 1, transform: 'translateY(0)' })
            )
        ]),
        transition('open => *', [
            animate(
                    '0.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    style({ opacity: 0, transform: 'translateY(10%)' })
            )
        ])
    ])
];

type ModalState = 'open' | 'closed';

@Component({
    host: {
        '[@inOutAnimation]': 'animate',
        '(@inOutAnimation.done)': 'onAnimationDone($event)',
        class: 'modal-container'
    },
    template: `
        <div class="modal">
            <header>{{ title }}
                <button (click)="close()">X</button>
            </header>
            <section>
                <template #modalContent></template>
            </section>
        </div>
    `,
    styleUrls: ['./modal.v2.component.scss'],
    standalone: true,
    animations,
    imports: [CommonModule]
})
export class ModalV2Container implements OnDestroy, OnInit {
    @ViewChild('modalContent', { read: ViewContainerRef })
    public modalContent!: ViewContainerRef;

    @Input() public opened = false;
    @Input() public readyToCloseSubject!: Subject<void>;
    @Input() public beforeCloseSubject!: Subject<void>;
    @Input() public title!: string | undefined;
    @Input() public modalRef!: ModalRef<any>;
    private destroyed$: Subject<void> = new Subject();

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    protected get animate(): ModalState {
        return this.opened ? 'open' : 'closed';
    }

    protected onAnimationDone(event: AnimationEvent): void {
        const toState = event.toState as ModalState;
        if (toState === 'closed') {
            this.readyToCloseSubject.next();
        }
    }

    ngOnInit(): void {
        this.beforeCloseSubject.pipe(takeUntil(this.destroyed$)).subscribe(() => {
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    close(): void {
        this.modalRef.close();
    }
}

export class ModalBaseRef {
    private _beforeClose: Subject<any>;

    private _afterClosed = new Subject<any>();
    private _close = new Subject<void>();
    private _readyToCloseSubject: Subject<void>;
    private _data: any;
    protected destroyed$: Subject<void> = new Subject();

    constructor(
            closeHandler: Subject<void>,
            readyToCloseSubject: Subject<void>,
            beforeClose: Subject<void>
    ) {
        this._close = closeHandler;
        this._beforeClose = beforeClose;
        this._readyToCloseSubject = readyToCloseSubject;
        this._readyToCloseSubject.pipe(takeUntil(this.destroyed$)).subscribe(() => {
            this._afterClosed.next(this._data);
            this._close.next();
        });
    }

    public beforeClose(): Observable<void> {
        return this._beforeClose
                   .asObservable()
                   .pipe(first(), share(), takeUntil(this.destroyed$));
    }

    public afterClosed(): Observable<void> {
        return this._afterClosed
                   .asObservable()
                   .pipe(first(), share(), takeUntil(this.destroyed$));
    }

    public close(data?: any) {
        this._data = data;
        console.log('close', data);
        this._beforeClose.next(data);
    }
}

@Injectable()
export class ModalRef<T> extends ModalBaseRef implements OnDestroy {
    public ngOnDestroy() {
        this.destroyed$.next();
    }
}

@Component({
    host: {
        '[@inOutAnimation]': '',
        class: 'modal-overlay'
    },
    template: `
        <ng-content></ng-content> `,
    styleUrls: ['./modal.v2.component.scss'],
    animations: [
        trigger('inOutAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate(
                        '.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
                        style({ opacity: 1 })
                )
            ]),
            transition(':leave', [
                style({ opacity: 1 }),
                animate(
                        '.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
                        style({ opacity: 0, transform: 'translateY(100%)' })
                )
            ])
        ])
    ]
})
export class ModalOverlay implements OnDestroy {
    @Input() public modalRef!: ModalBaseRef;

    constructor() {}

    @HostListener('click', ['$event'])
    public onClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.modalRef.close();
        }
    }

    ngOnDestroy(): void {}
}

type ModalOptions = {
    title?: string;
    type?: any;
};

@Injectable({
    providedIn: 'root'
})
export class ModalV2Service {
    constructor(
            private environmentInjector: EnvironmentInjector,
            @Inject(DOCUMENT) private document: Document
    ) {}

    public openModal<T>(
            component: Type<T>,
            {
                inputs,
                options
            }: {
                inputs?: Partial<T>;
                options?: ModalOptions;
            }
    ) {
        const closeHandler = new ReplaySubject<void>();
        const readyToCloseSubject = new ReplaySubject<void>();
        const beforeClose = new ReplaySubject<void>();
        const modalRef = new ModalRef<T>(
                closeHandler,
                readyToCloseSubject,
                beforeClose
        );
        const environmentInjector = createEnvironmentInjector(
                [
                    {
                        provide: ModalRef<T>,
                        useValue: modalRef
                    }
                ],
                this.environmentInjector
        );

        const modalContent = createComponent(component, {
            environmentInjector
        });
        Object.entries(inputs ?? {}).forEach(([key, value]) => {
            const actualKey = key as keyof T;
            const actualValue = value as T[keyof T];
            return (modalContent.instance[actualKey] = actualValue);
        });

        const container = createComponent(ModalV2Container, {
            environmentInjector
        });
        container.instance.readyToCloseSubject = readyToCloseSubject;
        container.instance.beforeCloseSubject = beforeClose;
        container.instance.modalRef = modalRef;
        container.instance.title = options?.title;
        const subscriber = container.instance.beforeCloseSubject.subscribe(() => {
            container.instance.opened = false;
            container.changeDetectorRef.detectChanges();
        });

        const overlayComponent = createComponent(ModalOverlay, {
            environmentInjector,
            //projectableNodes: [[container.location.nativeElement]]
        });
        overlayComponent.instance.modalRef = modalRef;
        overlayComponent.changeDetectorRef.detectChanges();
        this.document.body.appendChild(overlayComponent.location.nativeElement);
        container.instance.opened = true;
        container.changeDetectorRef.detectChanges();
        container.instance.modalContent.createComponent(component, {
            injector: environmentInjector
        });
        container.changeDetectorRef.detectChanges();

        container.location.nativeElement.classList.add(options?.type ?? 'default');
        this.document.body.appendChild(container.location.nativeElement);
        console.log('container', container.location.nativeElement);

        closeHandler.pipe(first()).subscribe(() => {
            subscriber.unsubscribe();
            container.instance.opened = false;
            container.changeDetectorRef.detectChanges();
            modalContent.destroy();
            container.destroy();
            container.location.nativeElement.remove();
            overlayComponent.destroy();
            overlayComponent.location.nativeElement.remove();
            modalRef.ngOnDestroy();
        });
        return modalRef;
    }
}
