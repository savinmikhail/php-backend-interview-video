import type {CSSProperties, ReactNode} from 'react';
import {reveal} from './InterviewShell';

export type RelationshipVariant = 'interface' | 'abstract' | 'trait';

const Layer = ({children, style, className = ''}: {children: ReactNode; style: CSSProperties; className?: string}) => (
  <div className={className} style={style}>{children}</div>
);

const InterfaceDiagram = ({frame, fps}: {frame: number; fps: number}) => (
  <div className="oop-diagram oop-diagram--interface">
    <Layer className="oop-node oop-node--root" style={reveal(frame, 0)}>
      <small>interface</small>
      <strong>Notifier</strong>
      <Layer style={reveal(frame, 5 * fps)} className="oop-contract-method">
        <code>send(Message $message): void</code>
      </Layer>
    </Layer>
    <Layer className="oop-branches" style={reveal(frame, 11 * fps)}>
      <div className="oop-branch">
        <span>implements</span>
        <article className="oop-node oop-node--cyan"><strong>EmailNotifier</strong></article>
      </div>
      <div className="oop-branch">
        <span>implements</span>
        <article className="oop-node oop-node--cyan"><strong>TelegramNotifier</strong></article>
      </div>
    </Layer>
    <Layer className="oop-consumer" style={reveal(frame, 14 * fps)}>
      <span>принимает контракт</span>
      <code>OrderService(Notifier $notifier)</code>
    </Layer>
  </div>
);

const AbstractDiagram = ({frame, fps}: {frame: number; fps: number}) => (
  <div className="oop-diagram oop-diagram--abstract">
    <Layer className="oop-node oop-node--root oop-node--abstract" style={reveal(frame, 0)}>
      <small>abstract class</small>
      <strong>Response</strong>
      <div className="oop-methods">
        <Layer className="oop-method oop-method--ready" style={reveal(frame, 5 * fps)}>
          <code>sendHeaders(): void</code>
          <span>общая реализация</span>
        </Layer>
        <Layer className="oop-method oop-method--required" style={reveal(frame, 5 * fps + 5)}>
          <code>abstract render(): string</code>
          <span>реализует наследник</span>
        </Layer>
      </div>
    </Layer>
    <Layer className="oop-branches oop-branches--abstract" style={reveal(frame, 11 * fps)}>
      <div className="oop-branch">
        <span>extends</span>
        <article className="oop-node oop-node--purple"><strong>BinaryResponse</strong></article>
      </div>
      <div className="oop-branch">
        <span>extends</span>
        <article className="oop-node oop-node--purple"><strong>JsonResponse</strong></article>
      </div>
    </Layer>
  </div>
);

const TraitDiagram = ({frame, fps}: {frame: number; fps: number}) => (
  <div className="oop-diagram oop-diagram--trait">
    <Layer className="oop-node oop-node--root oop-node--trait" style={reveal(frame, 0)}>
      <small>trait</small>
      <strong>Timestampable</strong>
      <div className="oop-trait-members">
        <code>$createdAt</code>
        <code>$updatedAt</code>
        <code>touch(): void</code>
      </div>
    </Layer>
    <Layer className="oop-branches oop-branches--trait" style={reveal(frame, 6 * fps)}>
      <div className="oop-branch">
        <span>use Timestampable</span>
        <article className="oop-node oop-node--plain"><strong>Order</strong></article>
      </div>
      <div className="oop-branch">
        <span>use Timestampable</span>
        <article className="oop-node oop-node--plain"><strong>Article</strong></article>
      </div>
    </Layer>
    <Layer className="oop-caption" style={reveal(frame, 14 * fps)}>
      Поведение без общей иерархии
    </Layer>
  </div>
);

export const TypeRelationshipDiagram = ({variant, frame, fps}: {variant: RelationshipVariant; frame: number; fps: number}) => {
  if (variant === 'interface') return <InterfaceDiagram frame={frame} fps={fps} />;
  if (variant === 'abstract') return <AbstractDiagram frame={frame} fps={fps} />;
  return <TraitDiagram frame={frame} fps={fps} />;
};
