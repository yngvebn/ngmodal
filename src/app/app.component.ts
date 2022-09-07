import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ModalV2Service } from './modal.v2/modal.v2.component';
import { TestModalComponent } from './test-modal.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="sticky-header">
        <button (click)="modal()">Normal modal</button>
        <button (click)="modalDrawer()">Drawer modal</button>
        <pre>{{ dialogResponse$ | async | json }}</pre>
    </div>
    <div
      style="height: 12990px; background: linear-gradient(180deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%);"
    >
      This is a tall div
    </div>
  `,
})
export class AppComponent implements OnInit {
  title = 'ng14-regular';
  dialogResponse$!: Observable<any>;
  constructor(private modalService: ModalV2Service) {}

  ngOnInit(): void {
    // this.modal();
  }

    public modal() {
        this.dialogResponse$ = this.modalService
                                   .openModal(TestModalComponent, {
                                       inputs: {
                                           text: 'Hello world!',
                                       },
                                       options: {
                                           title: 'With title set by opener',
                                       },
                                   })
                                   .afterClosed();
    }
    public modalDrawer() {
        this.dialogResponse$ = this.modalService
                                   .openModal(TestModalComponent, {
                                       inputs: {
                                           text: 'Hello world!',
                                       },
                                       options: {
                                           title: 'With title set by opener',
                                           type: 'drawer',
                                       },
                                   })
                                   .afterClosed();
    }
}
