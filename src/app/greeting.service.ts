import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class GreetingService {
  constructor() {}

  public greet() {
    return 'Hello from a service!';
  }
}
