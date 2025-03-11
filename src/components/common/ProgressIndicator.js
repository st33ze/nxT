import './ProgressIndicator.css';
import { createNode } from '../../utils/domUtils';
import { createSVGElement } from '../../assets/icons';

export default class ProgressIndicator {
  static create() {
    const indicator = createNode('div', { class: 'project-progress' });

    indicator.append(
      createNode('div', { class: 'inner-circle' }),
      createSVGElement('done')
    );

    return indicator;
  }

  static update(node, progress) {
    const projectCompleted = progress === 1;
    node.classList.toggle('project-completed', projectCompleted);
    
    if (progress == null) return;

    node.querySelector('.inner-circle')
      .style.setProperty('--progress', `${progress * 100}`);
    
    node.setAttribute(
      'label',
      projectCompleted 
        ? 'Project completed'
        : `Project completed in ${progress * 100}%`
    );
  }
}