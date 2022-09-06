import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  template: ` <p>about works!</p> `,
  styles: [],
  standalone: true,
})
export class AboutComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
