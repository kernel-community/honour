import {
  Accepted as AcceptedEvent,
  Forgiven as ForgivenEvent,
  Honoured as HonouredEvent,
  Proposed as ProposedEvent,
  Transfer as TransferEvent
} from "../generated/Honour/Honour"
import {
  Accepted,
  Forgiven,
  Honoured,
  Proposed,
  Transfer
} from "../generated/schema"

export function handleAccepted(event: AcceptedEvent): void {
  let entity = new Accepted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.forgiver = event.params.forgiver
  entity.forgiven = event.params.forgiven
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleForgiven(event: ForgivenEvent): void {
  let entity = new Forgiven(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.forgiver = event.params.forgiver
  entity.forgiven = event.params.forgiven
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHonoured(event: HonouredEvent): void {
  let entity = new Honoured(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.proposer = event.params.proposer
  entity.receiver = event.params.receiver
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProposed(event: ProposedEvent): void {
  let entity = new Proposed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.proposer = event.params.proposer
  entity.receiver = event.params.receiver
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
