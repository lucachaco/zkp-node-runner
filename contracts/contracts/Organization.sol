pragma solidity ^0.5.8;

import "./ISolution.sol";

contract Organization {

    /*
     Dev Note: Arrays in this contract start from 1. The reason being is that
     the way we're implementing null checks, we check a mapping to see if
     a given user (for example) has an index of > 0. If the index is 0,
     then we know that whatever we're checking for doesn't exist.
    */

    struct Group {
        bytes32 name;
        address[] members;
        mapping(address => uint) memberIndices;
        bytes32[] permissions; // Permissions that this group has
        mapping(bytes32 => uint) permissionIndices;
    }

    struct Solution {
        bytes32 namespace;
        bytes32[] permissions;
        address solutionAddress;
        bytes32 version;
    }

    // This is so that the constructor has permission to do what it needs to do
    // because we're doing things before permissions even exist.
    bool private constructing;

    bytes32[] public permissions = [
        bytes32("addPartner"),
        bytes32("removePartner"),
        bytes32("addGroup"),
        bytes32("removeGroup"),
        bytes32("addUserToGroup"),
        bytes32("removeUserFromGroup"),
        bytes32("addSolution"),
        bytes32("removeSolution"),
        bytes32("addLibrary"),
        bytes32("removeLibrary"),
        bytes32("addPermissionToGroup"),
        bytes32("removePermissionFromGroup")
    ];

    Group[] internal groups;
    mapping(bytes32 => uint) internal groupIndices;

    Solution[] internal solutions;
    mapping(bytes32 => uint) internal solutionIndices;

    // keeps track of dependency libs that are needed by solutions
    // i.e. DateTime
    mapping(bytes32 => address) internal libraries;

    address[] internal partners;
    mapping(address => uint) internal partnerIndices;

    // Keeps track of the groups that a member is a part of
    mapping(address => bytes32[]) internal memberGroupIndices;

    bytes32 public organizationName;
    bytes32 public constellationKey;

    modifier hasPermission(bytes32 permission) {
        if (constructing) {
            _;
        } else {
            bool permitted = false;
            // Iterate through groups that a member is part of
            for (uint i = 0; i < memberGroupIndices[tx.origin].length; i++) {
                Group storage currentGroup = groups[groupIndices[memberGroupIndices[tx.origin][i]]];
                // See if that group has the permission we're checking
                if (currentGroup.permissionIndices[permission] > 0) {
                    permitted = true;
                    break;
                }
            }
            if (!permitted) {
                revert("forbidden");
            }
            _;
        }
    }

    constructor(bytes32 _organizationName, bytes32 _constellationKey) public {
        constructing = true;

        organizationName = _organizationName;
        constellationKey = _constellationKey;

        // Add null group for null checks
        groups.push(Group("null", new address[](0), new bytes32[](0)));

        // Add null solution for null checks
        solutions.push(Solution("null", new bytes32[](0), address(0), "null"));

        addGroup("admin", permissions);
        addUserToGroup("admin", tx.origin);

        // To make arrays start from 1 to allow for null checks.
        partners.push(address(0));

        constructing = false;
    }

    /**
     * Allows an external contract to check a user's permissions.
     *
     * @param permission - Permission name.
     * @param solutionName - Solution name.
     * @param user - User to check permissions for.
     * @return boolean - True if the user has the permission.
     */
    function externalPermissionCheck(bytes32 permission, bytes32 solutionName, address user) external view returns (bool) {
        bool permitted = false;
        bool permissionExists = false;

        // Check to see if the solution includes the permission for the function
        // we're trying to execute.
        for (uint i = 0; i < solutions[solutionIndices[solutionName]].permissions.length; i++) {
            if (solutions[solutionIndices[solutionName]].permissions[i] == permission){
                permissionExists = true;
            }
        }

        // If we have the permission in solution struct, iterate through groups
        // that a member is part of to check if they have that permission
        if (permissionExists) {
            for (uint j = 0; j < memberGroupIndices[user].length; j++) {
                Group storage currentGroup = groups[groupIndices[memberGroupIndices[user][j]]];

                // See if that group has the permission we're checking
                if (currentGroup.permissionIndices[permission] > 0) {
                    permitted = true;
                    break;
                }
            }
        }

        return permitted;
    }

 
    /**
     * Returns the addresses and permissions associated with this group.
     *
     * @param name - Name of group.
     * @return [members, permissions] - Addresses and permissions associated with the group.
     */
    function getGroup(bytes32 name) external view returns (address[] memory, bytes32[] memory) {
        return (groups[groupIndices[name]].members, groups[groupIndices[name]].permissions);
    }

    /**
     * Returns names of all groups.
     */
    function getGroupNames() external view returns (bytes32[] memory) {
        bytes32[] memory output = new bytes32[](groups.length);
        for (uint i = 0; i < groups.length; i++) {
            output[i] = groups[i].name;
        }
        return output;
    }

    /**
     * Adds a group with a list of permissions, and associates those permissions to that group.
     *
     * @param name - Name of group.
     * @param _permissions - globalPermissions that this group is allowed to take, see above enum for details.
     */
    function addGroup(bytes32 name, bytes32[] memory _permissions) public hasPermission("addGroup") {
        if (groupIndices[name] != 0 && !constructing) revert("duplicate_group");

        // Add new group to the array and save its index
        groupIndices[name] = groups.length++;
        Group storage group = groups[groupIndices[name]];
        group.name = name;
        group.members = [ address(0) ];
        group.permissions = [ bytes32("null") ];

        for (uint i = 0; i < _permissions.length; i++) {
            addPermissionToGroup(name, _permissions[i]);
        }
    }

    /**
     * Removes a group from all associated permissions, then removes group from the contract.
     *
     * @param name - Name of group.
     */
    function removeGroup(bytes32 name) external hasPermission("removeGroup") {
        Group storage removingGroup = groups[groupIndices[name]];
        Group storage lastGroup = groups[groups.length - 1];

        // members[0] is purposefully a blank address, so for existing groups,
        // group.members.length > 0 always
        if (removingGroup.members.length == 0) revert("group_not_found");

        delete removingGroup.name;
        delete removingGroup.members;
        delete removingGroup.permissions;

        uint removedGroupIndex = groupIndices[name];
        groupIndices[lastGroup.name] = removedGroupIndex;
        groups[groupIndices[name]] = groups[groups.length - 1];
        groups.length--;
        groupIndices[name] = 0;
    }

    /**
     * Adds a user to an existing group.
     *
     * @param name - Name of group.
     * @param user - User to add.
     */
    function addUserToGroup(bytes32 name, address user) public hasPermission("addUserToGroup") {
        Group storage group = groups[groupIndices[name]];

        // members[0] is purposefully a blank address, so for existing groups,
        // group.members.length > 0 always
        if (group.members.length == 0) revert("group_not_found");
        if (group.members[group.memberIndices[user]] != address(0)) revert("duplicate_user");

        memberGroupIndices[user].push(name);

        uint index = group.members.length;
        group.members.push(user);
        group.memberIndices[user] = index;
    }

    /**
     * Removes user from group, reverts if user did not exist in group.
     *
     * @param name - Name of group.
     * @param user - User to remove.
     */
    function removeUserFromGroup(bytes32 name, address user) external hasPermission("removeUserFromGroup") {
        Group storage group = groups[groupIndices[name]];

        if (group.members.length == 0) revert("group_not_found");

        bytes32[] storage usersGroups = memberGroupIndices[user];
        // Remove group from memberGroupIndices
        for (uint i = 0; i < usersGroups.length; i++) {
            if (usersGroups[i] == name) {
                usersGroups[i] = usersGroups[usersGroups.length - 1];
                usersGroups.length--;
            }
        }

        // Remove group from memberIndices mapping
        if (group.members[group.memberIndices[user]] != address(0)) {
            group.members[group.memberIndices[user]] = group.members[group.members.length - 1];
            group.memberIndices[user] = 0;
            group.members.length--;
            return;
        }
        revert("user_not_found");
    }

    /**
     * Returns the permissions, address, and version of this solution.
     *
     * @param solutionName - Name of solution.
     */
    function getSolution(bytes32 solutionName) external view returns (bytes32[] memory, address, bytes32) {
        return (
          solutions[solutionIndices[solutionName]].permissions,
          solutions[solutionIndices[solutionName]].solutionAddress,
          solutions[solutionIndices[solutionName]].version
        );
    }

    /**
     * Returns the organization, namespace, and version of this solution.
     *
     * @param solutionName - Name of the solution.
     */
    function solutionExists(bytes32 solutionName) external view returns (bool) {
        bool exists = solutionIndices[solutionName] != 0;
        return exists;
    }

    function addSolution(address solutionAddress) public hasPermission("addSolution") {
        ISolution deployedSolution = ISolution(solutionAddress);
        bytes32 solutionName = deployedSolution.getNamespace();
        bytes32[] memory solutionPermissions = deployedSolution.getPermissionNames();
        if (solutionIndices[solutionName] != 0) revert("duplicate_solution");

        // loop through all permissions from the solution and automatically grant those
        // permissions to all admins of the organization
        for (uint i = 0; i < solutionPermissions.length; i++) {
            addPermissionToGroup("admin", solutionPermissions[i]);
        }

        // Add new solution to the array and save its index
        solutionIndices[solutionName] = solutions.length++;
        Solution storage solution = solutions[solutionIndices[solutionName]];
        solution.namespace = solutionName;
        solution.permissions = solutionPermissions;
        solution.solutionAddress = solutionAddress;
        solution.version = deployedSolution.getVersion();
    }

    function removeSolution(bytes32 namespace) public hasPermission("removeSolution") {
        Solution storage removingSolution = solutions[solutionIndices[namespace]];
        Solution storage lastSolution = solutions[solutions.length - 1];

        // solutions[0] is purposefully a blank address, so for existing solutions,
        // solution.members.length > 0 always
        if (solutionIndices[removingSolution.namespace] == 0) revert("solution_not_found");

        delete removingSolution.namespace;
        delete removingSolution.permissions;
        delete removingSolution.solutionAddress;
        delete removingSolution.version;

        uint removedSolutionIndex = solutionIndices[namespace];
        solutionIndices[lastSolution.namespace] = removedSolutionIndex;
        solutions[solutionIndices[namespace]] = solutions[solutions.length - 1];
        solutions.length--;
        solutionIndices[namespace] = 0;
    }

    /**
     * Returns the address of this library.
     *
     * @param libraryName - Name of library.
     */
    function getLibrary(bytes32 libraryName) external view returns (address) {
        return libraries[libraryName];
    }

    /**
     * Returns true if the library exists
     *
     * @param libraryName - Name of the library.
     */
    function libraryExists(bytes32 libraryName) external view returns (bool) {
        return libraries[libraryName] != address(0);
    }

    function addLibrary(bytes32 libraryName, address libraryAddress) public hasPermission("addLibrary") {
        libraries[libraryName] = libraryAddress;
    }

    function removeLibrary(bytes32 libraryName) public hasPermission("removeLibrary") {
        libraries[libraryName] = address(0);
    }

    function addPermissionToGroup(bytes32 name, bytes32 permission) public hasPermission("addPermissionToGroup") {
        Group storage group = groups[groupIndices[name]];

        if (group.permissionIndices[permission] != 0) {
            revert("duplicate_permission");
        }

        uint index = group.permissions.length;
        group.permissionIndices[permission] = index;
        group.permissions.push(permission);
    }

    /**
     * Adds a list of things that a group is allowed to do.
     *
     * @param name - Group to add permissions to.
     * @param _permissions - Array of globalPermissions/permissions that a group is allowed to do.
     */
    function addPermissionToGroup(bytes32 name, bytes32[] memory _permissions) public hasPermission("addPermissionToGroup") {
        for (uint i = 0; i < _permissions.length; i++) {
            addPermissionToGroup(name, _permissions[i]);
        }
    }

    function removePermissionFromGroup(bytes32 name, bytes32 permission) public hasPermission("removePermissionFromGroup") {
        if (permission == "null") revert("forbidden");

        // Group to remove
        Group storage group = groups[groupIndices[name]];
        if (group.permissionIndices[permission] == 0) {
            revert("permission_not_found");
        }
        bytes32 lastPermission = group.permissions[group.permissions.length - 1];

        // Remove permission from group
        uint removedIndex = group.permissionIndices[permission];

        // Move last permission to removed permission's position
        group.permissions[removedIndex] = group.permissions[group.permissions.length - 1];

        // Replace the moved group's index with its new index.
        group.permissionIndices[lastPermission] = removedIndex;
        group.permissionIndices[permission] = 0;
        group.permissions.length--;
    }

    /**
     * Removes permissions from a group.
     *
     * @param name - Group to remove permissions from.
     * @param _permissions - Array of permissions that a group is no longer allowed to do.
     */
    function removePermissionFromGroup(bytes32 name, bytes32[] calldata _permissions) external hasPermission("removePermissionFromGroup") {
        for (uint i = 0; i < _permissions.length; i++) {
            removePermissionFromGroup(name, _permissions[i]);
        }
    }

    /**
     * Returns Organization Name and constellationKey
     */
    function getInfo() external view returns (bytes32, bytes32) {
      return (
        organizationName,
        constellationKey
      );
    }

    /**
    * Returns lists of permissions for tx.origin
    */
    function getMemberPermissions(address sender) external view returns (bytes32[] memory) {

      uint totalPermissions = 0;
      for (uint i = 0; i < memberGroupIndices[sender].length; i++) {
        Group storage currentGroup = groups[groupIndices[memberGroupIndices[sender][i]]];
        totalPermissions += currentGroup.permissions.length;
      }

      bytes32[] memory memberPermissions = new bytes32[](totalPermissions);
      uint index = 0;
      for (uint i = 0; i < memberGroupIndices[sender].length; i++) {
        Group storage currentGroup = groups[groupIndices[memberGroupIndices[sender][i]]];
        for (uint j = 0; j < currentGroup.permissions.length; j++) {
            memberPermissions[index] = currentGroup.permissions[j];
            index++;
        }
      }

      return memberPermissions;
    }
}