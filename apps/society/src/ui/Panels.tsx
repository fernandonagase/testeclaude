import { ATTRIBUTE_DEFS, type GroupView, type IndividualView, type SimEvent } from '../engine';
import { SERIES_COLOR } from './Dashboard';
import { formatCount, formatDecimal, formatPercent } from './format';

export function GroupPanel({ groups }: { groups: readonly GroupView[] }) {
  if (groups.length === 0) {
    return <p className="empty">Ninguém se agrupou ainda.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Patamar</th>
          <th className="num">Membros</th>
          <th className="num">Coesão</th>
          <th className="num">Tecn.</th>
          <th className="num">Cultura</th>
          <th className="num">Estoque</th>
          <th>Liderança</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <tr key={group.id}>
            <td>
              <strong>{group.name}</strong>
              <span className="sub">fundado no ano {group.foundedYear}</span>
            </td>
            <td>
              <span className="badge">{group.tierLabel}</span>
            </td>
            <td className="num">{formatCount(group.size)}</td>
            <td className="num">
              <Meter value={group.cohesion} color={SERIES_COLOR.society} />
            </td>
            <td className="num">{formatDecimal(group.tech, 1)}</td>
            <td className="num">
              <Meter value={group.culture} color={SERIES_COLOR.society} />
            </td>
            <td className="num">{formatDecimal(group.stockPerCapita, 0)}</td>
            <td>{group.leaderName ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NotablesPanel({ notables }: { notables: readonly IndividualView[] }) {
  if (notables.length === 0) {
    return <p className="empty">Nenhum indivíduo vivo.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Indivíduo</th>
          <th className="num">Idade</th>
          <th className="num">Essenciais</th>
          <th className="num">Mental</th>
          <th className="num">Poder</th>
          <th>Atributos</th>
        </tr>
      </thead>
      <tbody>
        {notables.map((person) => (
          <tr key={person.id}>
            <td>
              <strong>{person.name}</strong>
              <span className="sub">
                {person.groupName ?? 'sem grupo'}
                {person.isLeader ? ' · líder' : ''}
              </span>
            </td>
            <td className="num">{Math.floor(person.ageYears)}</td>
            <td className="num">
              <Meter value={person.essentials / 100} color={SERIES_COLOR.material} />
            </td>
            <td className="num">
              <Meter value={person.mental / 100} color={SERIES_COLOR.mind} />
            </td>
            <td className="num">{formatDecimal(person.power, 1)}</td>
            <td>
              <span className="attr-strip">
                {ATTRIBUTE_DEFS.map((def) => (
                  <span
                    key={def.id}
                    className="attr-bar"
                    title={`${def.label}: ${formatPercent(person.attributes[def.id])}`}
                  >
                    <span style={{ height: `${person.attributes[def.id] * 100}%` }} />
                  </span>
                ))}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EventLog({ events }: { events: readonly SimEvent[] }) {
  if (events.length === 0) {
    return <p className="empty">Sem acontecimentos.</p>;
  }

  return (
    <ol className="events">
      {events.map((event) => (
        <li key={event.id} className={`event event-${event.severity}`}>
          <span className="event-time">ano {event.year}</span>
          <span className="event-text">{event.message}</span>
        </li>
      ))}
    </ol>
  );
}

function Meter({ value, color }: { value: number; color: string }) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <span className="meter">
      <span className="meter-fill" style={{ width: `${clamped * 100}%`, background: color }} />
      <span className="meter-text">{formatPercent(clamped)}</span>
    </span>
  );
}
