#!/bin/sh
# Reconcile the existing topic without deleting messages or shrinking partitions.
set -eu
set -f
partitions="${KAFKA_PARTITIONS-1}"
topic="${KAFKA_TOPIC:-zap-events}"
broker="${KAFKA_BROKERS:-kafka:9092}"
topics="${KAFKA_TOPICS_COMMAND:-/opt/kafka/bin/kafka-topics.sh}"
case "$partitions" in ''|*[!0-9]*) echo "KAFKA_PARTITIONS must be an integer from 1 to 256" >&2; exit 1;; esac
if ! [ "$partitions" -ge 1 ] || ! [ "$partitions" -le 256 ]; then
  echo "KAFKA_PARTITIONS must be an integer from 1 to 256" >&2; exit 1
fi
case "$topic" in ''|.|..|__*|*[!a-zA-Z0-9._-]*) echo "Invalid KAFKA_TOPIC" >&2; exit 1;; esac
if [ "${#topic}" -gt 249 ]; then echo "Invalid KAFKA_TOPIC" >&2; exit 1; fi
"$topics" --bootstrap-server "$broker" --create --if-not-exists --topic "$topic" --partitions "$partitions" --replication-factor 1
summary=$("$topics" --bootstrap-server "$broker" --describe --topic "$topic")
case "$summary" in *PartitionCount:*) count=${summary#*PartitionCount:};; *) echo "Could not read Kafka partition count" >&2; exit 1;; esac
set -- $count
current=$1
case "$current" in ''|*[!0-9]*) echo "Invalid Kafka partition count" >&2; exit 1;; esac
if [ "$partitions" -lt "$current" ]; then
  echo "Cannot reduce KAFKA_PARTITIONS from $current to $partitions. Keep it at $current or higher. No topic was deleted." >&2
  exit 1
fi
if [ "$partitions" -gt "$current" ]; then
  "$topics" --bootstrap-server "$broker" --alter --topic "$topic" --partitions "$partitions"
  echo "Increased Kafka partitions from $current to $partitions."
else
  echo "Kafka topic already has $current partition(s)."
fi
