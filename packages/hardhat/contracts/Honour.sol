//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Honour is ERC20, ReentrancyGuard {

    event Proposed(address indexed proposer, address indexed receiver, uint256 proposalId, uint256 amount);
    event Honoured(address indexed proposer, address indexed receiver, uint256 proposalId, uint256 amount);
    event Forgiven(address indexed forgiver, address indexed forgiven, uint256 forgivingId, uint256 amount);
    event Accepted(address indexed forgiver, address indexed forgiven, uint256 forgivingId, uint256 amount);

    error Unbalanced(string message);

    ERC20 public reserve;

    // Storage mappings for proposals and forgiveness.
    // This multiply nested mapping may seem unnecessary, but we need the address
    // of both parties to create trust graphs of more than depth 1, and we need the
    // unique ID in the UI to filter propose and forgive by those which have already
    // been honoured or accepted
    mapping(address => mapping(address => mapping(uint256 => uint256))) private proposal;
    mapping(address => mapping(address => mapping(uint256 => uint256))) private forgiving;

    uint256 proposalId;
    uint256 forgivingId;

    constructor(address _reserve) ERC20("HONOUR", "HON", 18) {
        reserve = ERC20(_reserve);
    }

    /**
     * @notice begin the process of creating HON by setting the amount and address it should be added to
     * @param  receiver the address who is set to take on the HON once created
     * @param  amount the amount of HON to be created once it is honoured into existence.
     */
    function propose(address receiver, uint256 amount)
        public
    {
        require (msg.sender != receiver, "Can't propose to self");
        require (amount > 0, "Propose more than 0");
        proposalId++;
        proposal[msg.sender][receiver][proposalId] += amount;
        emit Proposed(msg.sender, receiver, proposalId, amount);
    }

    /**
     * @notice create HON by accepting the amount set in propose()
     * @param proposer  the address whose proposal is being honoured
     * @param id        the unique ID of the proposal being honoured
     */
    function honour(address proposer, uint256 id)
        public
        nonReentrant
    {
        require(proposal[proposer][msg.sender][id] > 0, "Nothing to honour");
        uint256 amount = proposal[proposer][msg.sender][id];
        _mint(msg.sender, amount);
        proposal[proposer][msg.sender][id] = 0;
        emit Honoured(proposer, msg.sender, id, amount);
    }

    /**
     * @notice begin the process of erasing HON by setting the amount and address it should be removed from
     * @param  forgiven the address to be forgiven
     * @param  amount the amount to forgive
     */
    function forgive(address forgiven, uint256 amount)
        public
    {
        require(msg.sender != forgiven, "Can't forgive self");
        require (amount > 0, "Forgive more than 0");
        // you can't forgive more than your current balance, nor can you forgive more than
        // the current balance of the person you are forgiving
        if(balanceOf[msg.sender] < amount || balanceOf[forgiven] < amount) {
            revert Unbalanced("Unmatched balances");
        }
        forgivingId++;
        forgiving[msg.sender][forgiven][forgivingId] += amount;
        emit Forgiven(msg.sender, forgiven, forgivingId, amount);
    }

    /**
     * @notice erase HON by accepting the amount set in forgive()
     * @param forgiver  the address whose forgiveness is being accepted
     * @param id        the unique ID of the forgiveness being accepted
     */
    function accept(address forgiver, uint256 id)
        public
        nonReentrant
    {
        require(forgiving[forgiver][msg.sender][id] > 0, "Nothing to accept");
        uint256 amount = forgiving[forgiver][msg.sender][id];
        _burn(msg.sender, amount);
        forgiving[forgiver][msg.sender][id] = 0;
        emit Accepted(forgiver, msg.sender, id, amount);
    }
}