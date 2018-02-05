import {Injectable} from '@angular/core';

@Injectable()
export class DimensionsHelper {
  getDimensions(element: Element): ClientRect {
    return element.getBoundingClientRect();
  }
}
