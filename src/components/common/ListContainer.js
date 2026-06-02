import { createNode } from "../../utils/domUtils";

export default class ListContainer {

  #node;
  #list;
  #emptyState;
  #isEmpty;

  constructor(list, emptyState) {
    this.#list = list;
    this.#emptyState = emptyState;

    this.#node = createNode('div', { class: 'list-container' });

    this.sync();
  }

  sync() {
    const isEmpty = this.#list.isEmpty;

    if (isEmpty === this.#isEmpty) return;

    this.#isEmpty = isEmpty;

    this.#node.replaceChildren(
      this.#list.isEmpty
        ? this.#emptyState.node
        : this.#list.node
    );
  }

  get node() {
    return this.#node;
  }
}