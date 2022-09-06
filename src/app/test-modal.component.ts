import { Component, Input, Optional } from '@angular/core';
import { GreetingService } from './greeting.service';
import { ModalRef } from './modal.v2/modal.v2.component';
import { UpperPipe } from './upper.pipe';

@Component({
  template: `
    <div class="content">
      Provided in template: I am modal content!<br />
      Provided as @Input(): {{ text }}<br />
      Provided by injected service (with pipe):
      {{ greetingService.greet() | upper }}
    </div>
    <div class="actions">
      <button (click)="clickMe()">Ok</button
      ><button (click)="cancel()">Close</button>
    </div>
  `,
  styles: [
    `
      :host {
        background: #00FF00;
      }
    `,
  ],
  standalone: true,
  selector: 'test-modal-content',
  imports: [UpperPipe],
})
export class TestModalComponent {
  @Input() public text = '';

  constructor(
    protected greetingService: GreetingService,
    @Optional() private modalRef: ModalRef<TestModalComponent>
  ) {
    if (this.modalRef) {
      modalRef.beforeClose().subscribe((data) => {
        console.log('before close', data);
      });
      modalRef.afterClosed().subscribe((data) => {
        console.log('after closed', data);
      });
    }
  }

  clickMe() {
    this.modalRef.close({ message: 'some message' });
  }

  cancel() {
    this.modalRef.close();
  }
}
