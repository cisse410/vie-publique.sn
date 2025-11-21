import type { EntitySnapshotWithRelations, TreeBuildOptions, TreeNode } from '~~/types/etat'

/**
 * Construit un arbre hiérarchique à partir d'une liste de snapshots
 */
export function buildTree(
  snapshots: EntitySnapshotWithRelations[],
  options: TreeBuildOptions = {}
): TreeNode[] {
  const { maxDepth, includeRemoved = true, sortBy = 'order' } = options

  // Créer une map pour accès rapide par ID de snapshot
  const snapshotMap = new Map<string, TreeNode>()

  // Créer tous les nœuds
  snapshots.forEach(snapshot => {
    if (!includeRemoved && snapshot.change_type === 'removed') {
      return
    }

    const entity = typeof snapshot.public_entity_id === 'object'
      ? snapshot.public_entity_id
      : null

    const entityType = entity && typeof entity.entity_type_id === 'object'
      ? entity.entity_type_id
      : null

    if (!entity || !entityType) {
      return
    }

    snapshotMap.set(snapshot.id, {
      snapshot,
      entity,
      type: entityType,
      children: [],
      level: 0,
      isNew: snapshot.change_type === 'new',
      isModified: snapshot.change_type === 'modified',
      isRemoved: snapshot.change_type === 'removed',
      path: []
    })
  })

  // Construire la hiérarchie parent-enfant
  const roots: TreeNode[] = []
  let noParentCount = 0
  let parentNotFoundCount = 0

  snapshotMap.forEach(node => {
    const parentSnapshotId = typeof node.snapshot.parent_snapshot_id === 'string'
      ? node.snapshot.parent_snapshot_id
      : node.snapshot.parent_snapshot_id?.id

    if (!parentSnapshotId) {
      noParentCount++
    }

    if (parentSnapshotId && snapshotMap.has(parentSnapshotId)) {
      // Ce nœud a un parent
      const parent = snapshotMap.get(parentSnapshotId)!

      // Vérifier la profondeur max
      if (!maxDepth || parent.level < maxDepth - 1) {
        parent.children.push(node)
        node.level = parent.level + 1
        node.path = [...parent.path, parent.entity.slug]
      }
    } else {
      // Ce nœud est une racine
      if (parentSnapshotId && !snapshotMap.has(parentSnapshotId)) {
        parentNotFoundCount++
      }
      roots.push(node)
      node.path = [node.entity.slug]
    }
  })

  // Trier les nœuds selon les options
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    const sorted = [...nodes]

    switch (sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) =>
          a.snapshot.official_label.localeCompare(b.snapshot.official_label, 'fr')
        )
        break
      case 'type':
        sorted.sort((a, b) =>
          a.type.label.localeCompare(b.type.label, 'fr')
        )
        break
      // 'order' par défaut : conserver l'ordre original
    }

    // Trier récursivement les enfants
    sorted.forEach(node => {
      if (node.children.length > 0) {
        node.children = sortNodes(node.children)
      }
    })

    return sorted
  }

  const result = sortNodes(roots)
  return result
}

/**
 * Aplatit un arbre en une liste de nœuds
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []

  const flatten = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children.length > 0) {
        flatten(node.children)
      }
    })
  }

  flatten(nodes)
  return result
}

/**
 * Trouve un nœud dans l'arbre par ID d'entité
 */
export function findNodeByEntityId(
  entityId: string,
  nodes: TreeNode[]
): TreeNode | null {
  for (const node of nodes) {
    if (node.entity.id === entityId) {
      return node
    }

    if (node.children.length > 0) {
      const found = findNodeByEntityId(entityId, node.children)
      if (found) return found
    }
  }

  return null
}

/**
 * Récupère tous les parents d'un nœud
 */
export function getAncestors(node: TreeNode, tree: TreeNode[]): TreeNode[] {
  const ancestors: TreeNode[] = []

  const findParent = (currentNode: TreeNode, searchNodes: TreeNode[]): TreeNode | null => {
    for (const n of searchNodes) {
      if (n.children.includes(currentNode)) {
        return n
      }
      if (n.children.length > 0) {
        const parent = findParent(currentNode, n.children)
        if (parent) return parent
      }
    }
    return null
  }

  let current: TreeNode | null = node
  while (current) {
    const parent = findParent(current, tree)
    if (parent) {
      ancestors.unshift(parent)
      current = parent
    } else {
      break
    }
  }

  return ancestors
}

/**
 * Filtre l'arbre selon des critères
 */
export function filterTree(
  nodes: TreeNode[],
  predicate: (node: TreeNode) => boolean
): TreeNode[] {
  const filtered: TreeNode[] = []

  nodes.forEach(node => {
    const matchesFilter = predicate(node)
    const filteredChildren = node.children.length > 0
      ? filterTree(node.children, predicate)
      : []

    // Inclure le nœud si lui-même ou un de ses enfants correspond au filtre
    if (matchesFilter || filteredChildren.length > 0) {
      filtered.push({
        ...node,
        children: filteredChildren
      })
    }
  })

  return filtered
}

/**
 * Regroupe les ministères sous un parent virtuel "Ministères"
 * Pour une meilleure visualisation avec 3 parents : Présidence, Primature, Ministères
 */
export function groupMinistries(nodes: TreeNode[]): TreeNode[] {
  const presidence: TreeNode[] = []
  const primature: TreeNode[] = []
  const ministries: TreeNode[] = []
  const others: TreeNode[] = []

  nodes.forEach(node => {
    if (node.type.code === 'presidence') {
      presidence.push(node)
    } else if (node.type.code === 'primature') {
      primature.push(node)
    } else if (node.type.code === 'ministere') {
      ministries.push(node)
    } else {
      others.push(node)
    }
  })
  const result: TreeNode[] = []

  // Ajouter Présidence
  if (presidence.length > 0) {
    result.push(...presidence)
  }

  // Ajouter Primature
  if (primature.length > 0) {
    result.push(...primature)
  }

  // Créer un nœud virtuel "Ministères" si des ministères existent
  if (ministries.length > 0) {
    const ministriesParentNode: TreeNode = {
      snapshot: {
        id: 'virtual-ministeres',
        official_label: 'Ministères',
        public_entity_id: {
          id: 'virtual-ministeres',
          slug: 'ministeres',
          canonical_name: 'Ministères',
          entity_type_id: {
            id: 'virtual-ministeres-type',
            code: 'ministeres',
            label: 'Ministères',
            can_have_children: true,
            date_created: '',
            date_updated: '',
          },
          has_public_page: false,
          first_appearance: '',
          date_created: '',
          date_updated: '',
        },
        decree_id: ministries[0].snapshot.decree_id,
        parent_snapshot_id: null,
        date_created: '',
        date_updated: '',
      } as any,
      entity: {
        id: 'virtual-ministeres',
        slug: 'ministeres',
        canonical_name: 'Ministères',
        entity_type_id: {
          id: 'virtual-ministeres-type',
          code: 'ministeres',
          label: 'Ministères',
          can_have_children: true,
          date_created: '',
          date_updated: '',
        },
        has_public_page: false,
        first_appearance: '',
        date_created: '',
        date_updated: '',
      },
      type: {
        id: 'virtual-ministeres-type',
        code: 'ministeres',
        label: 'Ministères',
        can_have_children: true,
        date_created: '',
        date_updated: '',
      },
      children: ministries,
      level: 0,
      path: ['ministeres'],
    }

    // Ajuster le niveau des ministères
    ministries.forEach(ministry => {
      ministry.level = 1
      ministry.path = ['ministeres', ministry.entity.slug]
    })

    result.push(ministriesParentNode)
  }

  // NE PAS ajouter les entités orphelines dans l'arborescence
  // Elles ne devraient pas exister dans une hiérarchie correcte
  // et leur présence indique un problème dans les données

  return result
}

/**
 * Groupe les enfants d'un nœud par sections administratives
 * Selon les spécifications VP Specs Annuaire État
 *
 * Ne créer des sections virtuelles QUE pour les enfants directs (level + 1)
 * Les entités de regroupement (###, ####) conservent leur hiérarchie
 */
export function groupChildrenBySections(node: TreeNode): TreeNode {
  if (!node.children || node.children.length === 0) {
    return node
  }

  // Séparer les enfants directs des entités de regroupement
  const directChildren: TreeNode[] = []
  const regroupementChildren: TreeNode[] = []

  node.children.forEach(child => {
    if (child.type.code === 'entite_regroupement') {
      // Les entités de regroupement restent telles quelles avec leurs enfants
      regroupementChildren.push(groupChildrenBySections(child))
    } else {
      directChildren.push(child)
    }
  })

  // Types de sections à créer uniquement pour les enfants directs
  const sections = [
    { code: 'cabinet', label: 'Cabinet et services rattachés', codes: ['cabinet'] },
    { code: 'secretariat', label: 'Secrétariat général et services rattachés', codes: ['secretariat'] },
    { code: 'directions', label: 'Directions', codes: ['direction', 'direction_generale'] },
    { code: 'autres_administrations', label: 'Autres administrations', codes: ['autres_administrations'] },
    { code: 'etablissements_publics', label: 'Établissements publics', codes: ['etablissement_public'] },
    { code: 'societes_nationales', label: 'Sociétés nationales', codes: ['societe_nationale'] },
    { code: 'societes_participation', label: 'Sociétés à participation publique', codes: ['societe_participation_publique'] }
  ]

  const groupedChildren: TreeNode[] = []
  const ungroupedChildren: TreeNode[] = []

  sections.forEach(section => {
    // Vérifier si une entité de regroupement existe déjà avec un label similaire
    const normalizeLabel = (label: string) => label.toLowerCase().replace(/\s+/g, ' ').trim()
    const hasRegroupement = regroupementChildren.some(child =>
      normalizeLabel(child.snapshot.official_label).includes(normalizeLabel(section.label.split(' et ')[0]))
    )

    // Si une entité de regroupement existe déjà, ne pas créer de section virtuelle
    if (hasRegroupement) {
      return
    }

    const sectionChildren = directChildren.filter(child =>
      section.codes.includes(child.type.code)
    )

    if (sectionChildren.length > 0) {
      // Créer un nœud virtuel pour cette section
      const sectionNode: TreeNode = {
        snapshot: {
          id: `virtual-${node.entity.slug}-${section.code}`,
          official_label: section.label,
          public_entity_id: {
            id: `virtual-${node.entity.slug}-${section.code}`,
            slug: `${node.entity.slug}-${section.code}`,
            canonical_name: section.label,
            entity_type_id: {
              id: `virtual-section-type`,
              code: 'section',
              label: 'Section',
              can_have_children: true,
              date_created: '',
              date_updated: '',
            },
            has_public_page: false,
            first_appearance: '',
            date_created: '',
            date_updated: '',
          },
          decree_id: node.snapshot.decree_id,
          parent_snapshot_id: node.snapshot.id,
          date_created: '',
          date_updated: '',
        } as any,
        entity: {
          id: `virtual-${node.entity.slug}-${section.code}`,
          slug: `${node.entity.slug}-${section.code}`,
          canonical_name: section.label,
          entity_type_id: {
            id: `virtual-section-type`,
            code: 'section',
            label: 'Section',
            can_have_children: true,
            date_created: '',
            date_updated: '',
          },
          has_public_page: false,
          first_appearance: '',
          date_created: '',
          date_updated: '',
        },
        type: {
          id: `virtual-section-type`,
          code: 'section',
          label: 'Section',
          can_have_children: true,
          date_created: '',
          date_updated: '',
        },
        children: sectionChildren.map(child => ({
          ...child,
          level: node.level + 2,
          path: [...(node.path || []), `${node.entity.slug}-${section.code}`, child.entity.slug]
        })),
        level: node.level + 1,
        path: [...(node.path || []), `${node.entity.slug}-${section.code}`],
      }

      groupedChildren.push(sectionNode)
    }
  })

  // Récupérer les enfants directs qui ne correspondent à aucune section
  const allSectionCodes = sections.flatMap(s => s.codes)
  ungroupedChildren.push(...directChildren.filter(child =>
    !allSectionCodes.includes(child.type.code)
  ))

  return {
    ...node,
    children: [...groupedChildren, ...regroupementChildren, ...ungroupedChildren]
  }
}

/**
 * Applique le groupement par sections à tout l'arbre
 * Seulement pour les ministères et entités de niveau 1
 */
export function applyGroupingToTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => {
    // Appliquer le groupement seulement aux ministères (niveau racine des ministères)
    if (['ministere', 'presidence', 'primature'].includes(node.type.code)) {
      return groupChildrenBySections(node)
    }

    // Appliquer récursivement aux enfants
    if (node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(child => groupChildrenBySections(child))
      }
    }

    return node
  })
}
