import styles from "./route-placeholder.module.css";

type RoutePlaceholderProps = {
  implementationPass: "PASS 01" | "AFTER PASS 01";
  route: string;
  title: string;
};

export function RoutePlaceholder({
  implementationPass,
  route,
  title,
}: RoutePlaceholderProps) {
  return (
    <main className={styles.shell} data-route-skeleton={route}>
      <p className={styles.eyebrow}>PASS 00 / ROUTE RESERVED</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.status}>{implementationPass} / SCREEN NOT IMPLEMENTED</p>
    </main>
  );
}
