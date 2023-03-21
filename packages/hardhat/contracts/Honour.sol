//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ERC20.sol";

contract Honour is ERC20 {

    event Proposed(address indexed proposer, address indexed receiver, uint256 amount);
    event Honoured(address indexed proposer, address indexed receiver, uint256 amount);
    event Forgiven(address indexed forgiver, address indexed forgiven, uint256 amount);
    event Accepted(address indexed forgiver, address indexed forgiven, uint256 amount);

    error Unbalanced();

    ERC20 public reserve;

    // Storage mappings for proposals and forgiveness.
    // We store information about both the account with which the proposal/forgiving
    // is associated, as well as the account which initiated it, in order to ensure that people
    // can pick and choose at their leisure which proposals to accept and which to leave.
    mapping(address => mapping(address => uint256)) proposal;
    mapping(address => mapping(address => uint256)) forgiving;

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
        proposal[receiver][msg.sender] += amount;
        emit Proposed(msg.sender, receiver, amount);
    }

    /**
     * @notice create HON by accepting the amount set in propose()
     * @param proposer the address of the account which proposed this to ensure no-one is forced
     *                 to accept HON they don't want to.
     * @param amount   the amount of proposed HON to accept. This allows for multiple proposals to
     *                 exist from the same account without having to accept them all at the same time.
     *                 It has no check because, if the amount passed in is greater than what is stored
     *                 in the mapping, we default to just minting the max in the mapping.
     */
    function honour(address proposer, uint256 amount)
        public
    {
        if (proposal[msg.sender][proposer] > amount) {
            _mint(msg.sender, amount);
            proposal[msg.sender][proposer] -= amount;
        } else {
            _mint(msg.sender, proposal[msg.sender][proposer]);
            proposal[msg.sender][proposer] = 0;
        }
        emit Honoured(proposer, msg.sender, amount);
    }

    /**
     * @notice begin the process of erasing HON by setting the amount and address it should be removed from
     * @param  forgiven the address to be forgiven
     * @param  amount the amount to forgive
     */
    function forgive(address forgiven, uint256 amount)
        public
    {
        // you can't forgive more than your current balance, nor can you forgive more than
        // the current balance of the person you are forgiving
        if(balanceOf[msg.sender] < amount || balanceOf[forgiven] < amount) {
            revert Unbalanced();
        }
        forgiving[forgiven][msg.sender] += amount;
        emit Forgiven(msg.sender, forgiven, amount);
    }

    /**
     * @notice erase HON by accepting the amount set in forgive()
     * @param  forgiver allows us to differentiate between accounts who forgive so no-one is
     *                  forced to accept forgiveness from an account which may tarnish their history.
     */
    function accept(address forgiver)
        public
    {
        _burn(msg.sender, forgiving[msg.sender][forgiver]);
        forgiving[msg.sender][forgiver] = 0;
        emit Accepted(forgiver, msg.sender, forgiving[msg.sender][forgiver]);
    }
}