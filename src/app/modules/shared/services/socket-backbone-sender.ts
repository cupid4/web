import {Injectable} from '@angular/core';
import {BaseModel} from '../../backbone/models/base.model';
import {SocketMessageService} from './socket-message';
import {BaseCollection} from '../../backbone/collections/base.collection';
import {MessageMethodTypes} from './message';

@Injectable()
export class SocketBackboneSender {
  constructor(private socketMessageService: SocketMessageService) {
  }

  private sendRequestWithSocket(model, type) {
    let path;
    if (model.collection) {
      path = (<BaseCollection<BaseModel>>model.collection).endpoint;
    } else {
      path = model.endpoint;
    }
    path = path.replace(/^\/|\/$/g, ''); // strip start and end slash
    path = path.replace(/\//g, '.'); // replace '/' with '.'
    const data = model.toJSON();
    if (!model.isNew()) {
      path += `.${model.get(model.idAttribute)}`;
    }
    return this.socketMessageService
      .sendMessage(path, <MessageMethodTypes>MessageMethodTypes[type.toUpperCase()], data)
      .then(() => {
        return model;
      });
  }

  public decorate(model: BaseModel) {
    const superSync = model.sync;
    model.sync = (...args): any => {
      if (this.socketMessageService.isOpen()) {
        return this.sendRequestWithSocket(model, args[0]);
      } else {
        return superSync.apply(model, args);
      }
    };
  }
}
